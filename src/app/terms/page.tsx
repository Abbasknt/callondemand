"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ShieldCheck, 
  ArrowLeft, 
  Zap, 
  FileText, 
  Scale, 
  Lock, 
  Landmark, 
  UserCheck, 
  Globe,
  Database,
  Truck,
  AlertTriangle,
  CreditCard
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 rounded-xl">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-primary font-black">
            <Zap className="h-5 w-5 text-accent fill-accent" />
            Call on Demand.com
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card">
          <div className="h-3 bg-primary" />
          <CardHeader className="bg-primary/5 p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-inner">
                <FileText className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-3xl md:text-5xl font-black tracking-tighter">Production Service Agreement</CardTitle>
            <CardDescription className="text-muted-foreground mt-4 font-black uppercase tracking-[0.2em] text-[10px]">
              Revision: 2024.Q1 • Nigerian Regulatory Edition
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh] px-8 md:px-12 py-10">
              <div className="space-y-12 pb-12">
                
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Scale className="h-6 w-6" />
                    <h3 className="text-2xl font-black tracking-tight">1. Acceptance of Protocols</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    By initializing a session on the Call on Demand.com platform (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and COD Unified Life Ltd, compliant with the laws of the Federal Republic of Nigeria.
                  </p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Landmark className="h-6 w-6" />
                    <h3 className="text-2xl font-black tracking-tight">2. Financial Regulations (CBN Compliance)</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Call on Demand.com operates its financial gateway in strict accordance with the Central Bank of Nigeria (CBN) guidelines for digital payment services.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-5 bg-muted/30 rounded-2xl border-2 border-dashed">
                      <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">KYC & Identity</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Users must provide valid BVN or NIN details for high-tier wallet limits. You attest that all provided financial information is accurate.</p>
                    </div>
                    <div className="p-5 bg-muted/30 rounded-2xl border-2 border-dashed">
                      <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">AML Protocols</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">We monitor all wallet movements for suspicious activity. Fraudulent transactions will result in instant account restriction and reporting.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Database className="h-6 w-6" />
                    <h3 className="text-2xl font-black tracking-tight">3. Data Integrity (NDPR Compliance)</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    In compliance with the <strong>Nigeria Data Protection Regulation (NDPR)</strong>, your privacy is our operational priority.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex gap-3 items-start">
                      <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="h-3 w-3 text-accent" /></div>
                      <p className="text-sm text-muted-foreground"><span className="font-black text-foreground">Processing Consent:</span> You consent to the processing of your location, contact, and bank data for service fulfillment and payout settlement.</p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="h-3 w-3 text-accent" /></div>
                      <p className="text-sm text-muted-foreground"><span className="font-black text-foreground">Security Layer:</span> All production data is hardened using AES-256 encryption. We never store raw Transaction PINs on our servers.</p>
                    </li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Truck className="h-6 w-6" />
                    <h3 className="text-2xl font-black tracking-tight">4. Logistics & Fulfillment Liability</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Call on Demand.com coordinates physical fulfillment via a fleet of verified Unit Operators.
                  </p>
                  <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[2rem] space-y-3">
                    <div className="flex items-center gap-2 text-orange-700 font-black text-xs uppercase tracking-widest">
                      <AlertTriangle className="h-4 w-4" /> Liability Disclosure
                    </div>
                    <p className="text-xs text-orange-800/80 leading-relaxed font-medium italic">
                      Items booked for shipping or errands are insured up to a maximum of ₦50,000. High-value items exceeding this amount must be declared and special logistics protocols must be initialized by the Unit Agent.
                    </p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <CreditCard className="h-6 w-6" />
                    <h3 className="text-2xl font-black tracking-tight">5. Wallet & Payout Protocols</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Financial liquidity on the platform is powered by the COD Unified Wallet.
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-muted-foreground text-sm font-medium">
                    <li><span className="text-foreground font-bold">Funding:</span> Wallet funding via Monnify is instant. Charges applied by the gateway are non-refundable once the handshake is complete.</li>
                    <li><span className="text-foreground font-bold">2FA Security:</span> You are responsible for the confidentiality of your 6-digit Security PIN. Any action performed with your PIN is legally considered authorized by you.</li>
                    <li><span className="text-foreground font-bold">Withdrawals:</span> Payouts are only permitted to bank accounts matching your verified platform name.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <UserCheck className="h-6 w-6" />
                    <h3 className="text-2xl font-black tracking-tight">6. Professional Roles & Oversight</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Users designated as <span className="text-primary font-bold">Agents</span> or <span className="text-accent font-bold">Operators</span> are subject to additional performance and security audits. Attempting to bypass professional role restrictions or escalating privileges via unauthorized methods will result in immediate permanent suspension.
                  </p>
                </section>

                <section className="space-y-4 pt-10 border-t border-dashed">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Globe className="h-5 w-5" />
                    <h4 className="text-lg font-black uppercase tracking-widest">Governing Law</h4>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tighter">
                    These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from the use of the Call on Demand.com platform shall be subject to the exclusive jurisdiction of the competent courts in the Federal Capital Territory or Lagos State.
                  </p>
                </section>

              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="bg-muted/30 p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t">
            <div className="flex items-center gap-4">
              <BrandLogo iconOnly className="h-12 w-12" />
              <div>
                <p className="font-black text-sm uppercase">COD Production Protocol</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ensuring a future-proof lifestyle partner.</p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button asChild className="flex-1 md:flex-none h-14 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                <Link href="/register">Accept & Continue</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] pb-10">
          Call on Demand Unified Life Services • Registered in Nigeria
        </p>
      </div>
    </div>
  )
}
