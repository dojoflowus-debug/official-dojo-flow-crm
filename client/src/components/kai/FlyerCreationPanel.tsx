import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { Wand2, Download, RefreshCw, Loader2 } from 'lucide-react'

type ImageSize = 'instagram_post' | 'instagram_story' | 'facebook_ad' | 'flyer' | 'website_banner'

interface FlyerCreationPanelProps {
  onClose?: () => void
  initialPrompt?: string
}

const SIZES: { id: ImageSize; label: string; description: string }[] = [
  { id: 'instagram_post', label: 'Instagram Post', description: '1080×1080' },
  { id: 'instagram_story', label: 'Instagram Story', description: '1080×1920' },
  { id: 'facebook_ad', label: 'Facebook Ad', description: '1080×1350' },
  { id: 'flyer', label: 'Flyer', description: '1080×1440' },
  { id: 'website_banner', label: 'Website Banner', description: '1920×1080' },
]

export function FlyerCreationPanel({
  onClose,
  initialPrompt = '',
}: FlyerCreationPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [selectedSize, setSelectedSize] = useState<ImageSize>('flyer')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const generateMutation = trpc.creative.generateImage.useMutation()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for your flyer')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        size: selectedSize,
        mode: 'create',
      })

      setGeneratedImage(result.imageUrl)
      toast.success('Flyer generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate flyer. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flyer-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Flyer downloaded!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download flyer')
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Create a Flyer
        </CardTitle>
        <CardDescription>
          Describe your flyer and Kai will generate it for you
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Size Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Flyer Format</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedSize === size.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm">{size.label}</div>
                <div className="text-xs text-muted-foreground">{size.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Flyer Description</label>
          <Textarea
            placeholder="Describe what you want on your flyer... (e.g., 'Summer karate camp for kids, bold colors, fun and energetic')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-24 resize-none"
          />
        </div>

        {/* Generated Image Preview */}
        {generatedImage && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Generated Flyer</label>
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={generatedImage}
                alt="Generated flyer"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Flyer
              </>
            )}
          </Button>

          {generatedImage && (
            <>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>

              <Button
                onClick={() => setGeneratedImage(null)}
                variant="ghost"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                New
              </Button>
            </>
          )}

          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
            >
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
