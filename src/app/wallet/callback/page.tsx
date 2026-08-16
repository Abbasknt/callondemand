'use client';

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Wallet, Download, Clock, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { verifyTransaction } from "@/actions/monnify"
import { submitFundingRequest } from "@/actions/wallet-funding"
import { triggerReceiptPrint } from "@/lib/export-utils"
import { BrandLogo } from "@/components/brand-logo"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

/**
 * @fileOverview Standardized Callback node for Monnify settlement.
 * Hardened with institutional security: Monnify payment is verified and submitted
 * for Admin Approval without automatic wallet crediting.
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
        setErrorMsg("No transaction reference found in gateway callback.")
        return
      }

      try {
        const result = await verifyTransaction(reference, expectedAmount)
        
        if (result && result.success && (result.response?.paymentStatus === 'PAID' || result.response?.status === 'SUCCESS')) {
          const settledAmount = result.response.amount || expectedAmount || 0;
          setTxData(result.response)
          
          if (user && !updateProcessed.current) {
            const sessionKey = `processed_v3_${reference}`;
            const hasBeenProcessed = sessionStorage.getItem(sessionKey);
            
            if (!hasBeenProcessed) {
              const isServicePayment = !!serviceName;

              if (isServicePayment) {
                // Direct service checkout record
                if (walletRef) {
                  addDocumentNonBlocking(collection(walletRef, 'transactions'), {
                    type: 'Payment',
                    amount: settledAmount,
                    description: `Service Payment (${serviceName}) via Monnify`,
                    transactionDate: new Date().toISOString(),
                    status: 'Completed',
                    reference: reference,
                    paymentMethod: result.response.paymentMethod || 'Monnify',
                    service: serviceName
                  });
                }
              } else {
                // Wallet Funding: Submit for Admin Approval (AUTO-CREDIT DISABLED)
                await submitFundingRequest({
                  userId: user.uid,
                  userEmail: user.email || 'customer@call-on-demand.com',
                  userName: user.displayName || 'COD User',
                  amount: settledAmount,
                  reference: reference,
                  gatewayId: result.response.transactionReference || reference,
                  paymentMethod: result.response.paymentMethod || 'Monnify Direct',
                  contractCode: result.response.contractCode || '730430763017',
                  merchantAccount: result.response.merchantAccount || '8065933172',
                  amountPaid: result.response.amountPaid || settledAmount,
                  settlementAmount: result.response.settlementAmount || settledAmount,
                  paidOn: result.response.paidOn || new Date().toISOString(),
                  gatewayVerified: true,
                  gatewayStatus: 'PAID'
                });
              }

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
        setErrorMsg("Monnify verification timeout. Please check your wallet hub in a moment.")
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
        status === 'success' ? 'bg-amber-500' : status === 'failed' ? 'bg-red-500' : 'bg-primary animate-pulse'
      )} />
      
      <CardHeader className="text-center pt-10">
        <div className="flex justify-center mb-5">
          <div className={cn(
            "h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-xl shadow-black/5",
            status === 'success' ? "bg-amber-100 text-amber-600" : status === 'failed' ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
          )}>
            {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin" />}
            {status === 'success' && <Clock className="h-10 w-10 animate-pulse" />}
            {status === 'failed' && <XCircle className="h-10 w-10" />}
          </div>
        </div>
        <CardTitle className="text-2xl font-black tracking-tighter uppercase">
          {status === 'loading' ? 'Verifying Gateway' : status === 'success' ? 'Payment Verified' : 'Failed'}
        </CardTitle>
        <CardDescription className="text-xs font-semibold px-6 mt-2 text-slate-600">
          {status === 'loading' 
            ? 'Synchronizing with Monnify production ledger...' 
            : status === 'success' 
            ? 'Monnify payment confirmed. Your deposit has been queued for Admin clearance and will credit your wallet upon approval.' 
            : errorMsg}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-10 space-y-6">
        {reference && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
              <p className="text-[10px] font-black uppercase text-slate-500">Gateway Reference</p>
              <p className="font-mono font-bold text-xs uppercase text-slate-800">{reference.slice(0, 18)}...</p>
            </div>
            {txData && (
              <div className="flex justify-between items-end border-b border-slate-200/80 pb-2.5">
                <p className="text-[10px] font-black uppercase text-slate-500">Amount Paid</p>
                <p className="font-black text-xl text-primary">₦{txData.amount?.toLocaleString()}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <p className="text-[10px] font-black uppercase text-slate-500">Approval Status</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                <Clock className="h-3 w-3" /> Awaiting Admin Approval
              </span>
            </div>
          </div>
        )}

        <div className="bg-blue-50/80 border border-blue-200/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Security Notice:</strong> Auto-crediting is disabled by platform policy. All Monnify funding transactions are logged and reviewed by the Admin team to ensure ledger integrity.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          {status === 'success' && (
            <Button variant="outline" size="lg" className="w-full h-12 text-xs font-bold rounded-xl border gap-2" onClick={() => triggerReceiptPrint()}>
              <Download className="h-4 w-4" /> Download Transaction Receipt
            </Button>
          )}
          <Button asChild size="lg" className="w-full h-12 text-xs font-bold rounded-xl shadow-md bg-primary hover:bg-primary/90 uppercase">
            <Link href="/wallet"><Wallet className="mr-2 h-4 w-4" /> Return to Wallet Hub</Link>
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

