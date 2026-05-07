"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  onRemove?: () => void
  className?: string
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  label = "Upload Image"
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // Use Canvas to resize and compress image to keep base64 string small
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new (window as any).Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 600
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Compressed data URI
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          onChange(dataUrl)
          setLoading(false)
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload error:", error)
      setLoading(false)
    }
  }

  const triggerInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {value ? (
        <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border-4 border-muted group shadow-lg">
          <Image
            src={value}
            alt="Upload preview"
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              className="rounded-xl font-bold"
              onClick={triggerInput}
            >
              Change
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              className="rounded-xl font-bold"
              onClick={() => {
                onChange("")
                if (onRemove) onRemove()
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={triggerInput}
          className="w-full aspect-video rounded-[2.5rem] border-4 border-dashed border-muted-foreground/20 bg-muted/10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-all group"
        >
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <>
              <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">PNG, JPG or WebP (Max 1MB)</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
