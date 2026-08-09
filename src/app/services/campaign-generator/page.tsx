"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Wand2, 
  Utensils, 
  Shirt, 
  ShoppingBag, 
  Megaphone,
  ArrowRight
} from "lucide-react"
import { generateAdminContent, type AdminContentGeneratorInput } from "@/actions/admin-content"
import { useToast } from "@/hooks/use-toast"
import { PageTransition } from "@/components/page-transition"

type ContentType = 'foodMenuItem' | 'laundryService' | 'eCommerceProduct' | 'crowdfundingCampaign';

export default function AIContentGeneratorPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopying] = useState(false)
  const [contentType, setContentType] = useState<ContentType>('foodMenuItem')
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState<any>({
    itemName: "",
    ingredients: "",
    cuisine: "",
    serviceName: "",
    descriptionOfProcess: "",
    garmentTypesHandled: "",
    productName: "",
    features: "",
    benefits: "",
    campaignTitle: "",
    goal: "",
    briefDescription: "",
    targetAudience: ""
  })

  const handleGenerate = async () => {
    setIsLoading(true)
    setGeneratedContent(null)
    
    try {
      const input: any = { contentType, ...formData }
      const result = await generateAdminContent(input as AdminContentGeneratorInput)
      setGeneratedContent(result.generatedContent)
      toast({ title: "Content Generated!", description: "AI has crafted your listing description." })
    } catch (e) {
      console.error(e);
      toast({ title: "Generation Failed", description: "The AI agent is currently busy. Try again.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!generatedContent) return
    navigator.clipboard.writeText(generatedContent)
    setIsCopying(true)
    setTimeout(() => setIsCopying(false), 2000)
    toast({ title: "Copied to Clipboard" })
  }

  const getIcon = () => {
    if (contentType === 'foodMenuItem') return <Utensils className="h-6 w-6 text-orange-500" />
    if (contentType === 'laundryService') return <Shirt className="h-6 w-6 text-blue-500" />
    if (contentType === 'eCommerceProduct') return <ShoppingBag className="h-6 w-6 text-accent" />
    return <Megaphone className="h-6 w-6 text-primary" />
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-24 max-w-2xl mx-auto px-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight">AI Content Assistant</h1>
          <p className="text-muted-foreground font-medium">Generate premium listing descriptions sharp-sharp.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 p-8 border-b">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  {getIcon()}
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Listing Logic</CardTitle>
                  <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Protocol Phase: Context Input</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Content Strategy</Label>
                <Select value={contentType} onValueChange={(v: ContentType) => setContentType(v)}>
                  <SelectTrigger className="h-12 rounded-xl border-2 font-black">
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="foodMenuItem" className="font-bold">Food Menu Item</SelectItem>
                    <SelectItem value="laundryService" className="font-bold">Laundry Service</SelectItem>
                    <SelectItem value="eCommerceProduct" className="font-bold">E-commerce Product</SelectItem>
                    <SelectItem value="crowdfundingCampaign" className="font-bold">Crowdfunding Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-6 pt-4 border-t border-dashed">
                {contentType === 'foodMenuItem' && (
                  <>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Item Name</Label><Input value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="h-12 rounded-xl border-2 font-bold" placeholder="e.g. Jollof Rice Special" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Key Ingredients</Label><Input value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} className="h-12 rounded-xl border-2" placeholder="Basmati rice, bell peppers, thyme..." /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Cuisine</Label><Input value={formData.cuisine} onChange={e => setFormData({...formData, cuisine: e.target.value})} className="h-12 rounded-xl border-2" placeholder="e.g. Nigerian" /></div>
                  </>
                )}
                {contentType === 'laundryService' && (
                  <>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Service Label</Label><Input value={formData.serviceName} onChange={e => setFormData({...formData, serviceName: e.target.value})} className="h-12 rounded-xl border-2 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Process Description</Label><Textarea value={formData.descriptionOfProcess} onChange={e => setFormData({...formData, descriptionOfProcess: e.target.value})} className="min-h-[100px] rounded-xl border-2" placeholder="How do we treat the clothes?" /></div>
                  </>
                )}
                {contentType === 'eCommerceProduct' && (
                  <>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Product Headline</Label><Input value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="h-12 rounded-xl border-2 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Key Benefits</Label><Input value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})} className="h-12 rounded-xl border-2" /></div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-muted/10 border-t">
              <Button onClick={handleGenerate} disabled={isLoading} className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl gap-2 uppercase">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Wand2 className="h-6 w-6" /> Orchestrate Content</>}
              </Button>
            </CardFooter>
          </Card>

          {generatedContent && (
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-primary text-primary-foreground animate-in zoom-in-95 duration-500">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">AI Manifest</CardTitle>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10" onClick={copyToClipboard}>
                    {isCopied ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/5 font-medium leading-relaxed italic text-sm">
                  &quot;{generatedContent}&quot;
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Verified Output • COD GenAI Node</p>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
