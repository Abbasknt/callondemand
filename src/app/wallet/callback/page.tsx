'use client';

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Wallet, Download } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { verifyTransaction } from "@/actions/monnify"
import { triggerReceiptPrint } from "@/lib/export-utils"
import { BrandLogo } from "@/components/brand-logo"
import { useUser, useFirestore, useMemoFirebase, getDocumentSafe } from "@/firebase"
import { doc, collection, increment } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

/**
 * @fileOverview Standardized Callback node for Monnify settlement.
 * Hardened to automatically credit the user wallet upon verification.
 * Implements idempotency protection via Session Storage.
 */

function CallbackContent() {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const firestore = useFirestore()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [errorMsg, setErrorMsg] = useState("")
  const [txData, setTxData] = useState<any>(null)
  const updateProcessed = useRef(false)
  
  const reference = searchParams.get('paymentReference') || searchParams.get('transactionReference') || searchParams.get('reference');

  const amountParam = searchParams.get('amount') || searchParams.get('amountPaid');
  const expectedAmount = amountParam ? Number(amountParam) : undefined;
  const serviceName = searchParams.get('service') || searchParams.get('serviceName');

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);

  useEffect(() => {
    async function checkAndProcessStatus() {
      if (!reference) {
        setStatus('failed')
        setErrorMsg("No transaction reference found in handshake.")
        return
      }

      try {
        const result = await verifyTransaction(reference, expectedAmount)
        
        if (result && result.success && (result.response?.paymentStatus === 'PAID' || result.response?.status === 'SUCCESS')) {
          const settledAmount = result.response.amount || expectedAmount || 0;
          setTxData(result.response)
          
          if (user && walletRef && !updateProcessed.current) {
            const sessionKey = `processed_v2_${reference}`;
            const hasBeenProcessed = sessionStorage.getItem(sessionKey);
            
            if (!hasBeenProcessed) {
              const isServicePayment = !!serviceName;
              const txType = isServicePayment ? 'Payment' : 'Deposit';
              const description = isServicePayment 
                ? `Service Payment (${serviceName}) via Monnify`
                : `Wallet Funding: ${result.response.paymentMethod || 'Monnify Direct'}`;

              // If it's a deposit, increment balance; if it's direct service payment, log payment transaction
              if (!isServicePayment) {
                setDocumentNonBlocking(walletRef, { 
                  balance: increment(settledAmount),
                  lastDepositAt: new Date().toISOString()
                }, { merge: true });
              }

              addDocumentNonBlocking(collection(walletRef, 'transactions'), {
                type: txType,
                amount: settledAmount,
                description: description,
                transactionDate: new Date().toISOString(),
                status: 'Completed',
                reference: reference,
                paymentMethod: result.response.paymentMethod || 'Monnify',
                service: serviceName || 'Wallet'
              });

              sessionStorage.setItem(sessionKey, 'true');
              updateProcessed.current = true;
            }
          }
          setStatus('success')
        } else {
          setStatus('failed')
          setErrorMsg(result?.error || "The gateway could not confirm this settlement.")
        }
      } catch (e) {
        console.error(e);
        setStatus('failed')
        setErrorMsg("Handshake timeout. Please check your wallet hub in a moment.")
      }
    }

    if (reference) {
      checkAndProcessStatus()
    }
  }, [reference, user, firestore, walletRef, expectedAmount, serviceName])

  return (
    <Card className="w-full max-w-md shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white">
      <div className={cn(
        "h-2 transition-all duration-1000",
        status === 'success' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : 'bg-primary animate-pulse'
      )} />
      
      <CardHeader className="text-center pt-12">
        <div className="flex justify-center mb-6">
          <div className={cn(
            "h-24 w-24 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-black/5",
            status === 'success' ? "bg-green-100 text-green-600" : status === 'failed' ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
          )}>
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-12 w-12" />}
            {status === 'failed' && <XCircle className="h-12 w-12" />}
          </div>
        </div>
        <CardTitle className="text-3xl font-black tracking-tighter uppercase">
          {status === 'loading' ? 'Verifying' : status === 'success' ? 'Settled' : 'Failed'}
        </CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-widest px-8 mt-2">
          {status === 'loading' ? 'Synchronizing with production ledger...' : status === 'success' ? 'Wallet credited via digital handshake.' : errorMsg}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-10 pb-12 space-y-8">
        {reference && (
          <div className="bg-muted/30 p-8 rounded-[2rem] border-4 border-dashed text-left space-y-4">
            <div className="flex justify-between items-center border-b border-black/5 pb-3">
              <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Handshake Ref</p>
              <p className="font-mono font-bold text-[10px] uppercase">{reference.slice(0, 16)}...</p>
            </div>
            {txData && (
              <div className="flex justify-between items-end">
                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Value</p>
                <p className="font-black text-2xl text-primary">₦{txData.amount?.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          {status === 'success' && (
            <Button variant="outline" size="lg" className="w-full h-14 text-sm font-black rounded-xl border-2 uppercase gap-2" onClick={() => triggerReceiptPrint()}>
              <Download className="h-4 w-4" /> Thermal Receipt
            </Button>
          )}
          <Button asChild size="lg" className="w-full h-14 text-sm font-black rounded-xl shadow-xl bg-primary hover:bg-primary/90 uppercase">
            <Link href="/wallet"><Wallet className="mr-2 h-5 w-5" /> Return to Hub</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function WalletCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <CallbackContent />
      </Suspense>
    </div>
  )
}
