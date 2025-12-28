import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"

interface VerificationStatus {
  id?: string
  status: "pending" | "approved" | "rejected"
  idType?: string
  decisionReason?: string
  reviewedAt?: string
}

interface VerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  verificationStatus: VerificationStatus | null
  onVerificationSubmitted?: () => void
}

export function VerificationModal({
  open,
  onOpenChange,
  verificationStatus,
  onVerificationSubmitted,
}: VerificationModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [idType, setIdType] = useState("passport")
  const [idNumber, setIdNumber] = useState("")
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [idDocumentPreview, setIdDocumentPreview] = useState<string>("")
  const [selfiePreview, setSelfiePreview] = useState<string>("")

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "idDocument" | "selfie"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const preview = reader.result as string
      if (type === "idDocument") {
        setIdDocument(file)
        setIdDocumentPreview(preview)
      } else {
        setSelfie(file)
        setSelfiePreview(preview)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    // Validate inputs
    if (!idType || !idNumber || !idDocument || !selfie) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("idType", idType)
      formData.append("idNumber", idNumber)
      formData.append("idDocument", idDocument)
      formData.append("selfie", selfie)

      console.log("[Verification Modal] Submitting verification request")

      const response = await fetch("/api/user/submit-verification", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to submit verification")
      }

      const data = await response.json()
      console.log("[Verification Modal] Verification submitted successfully")

      toast({
        title: "Verification submitted",
        description: "Your verification request has been submitted. We'll review it shortly.",
      })

      // Reset form
      setIdType("passport")
      setIdNumber("")
      setIdDocument(null)
      setSelfie(null)
      setIdDocumentPreview("")
      setSelfiePreview("")

      onOpenChange(false)
      onVerificationSubmitted?.()
    } catch (err) {
      console.error("[Verification Modal] Error:", err)
      toast({
        title: "Error",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            Verify your identity to unlock premium features and build trust
          </DialogDescription>
        </DialogHeader>

        {verificationStatus && verificationStatus.status === "pending" && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Verification Pending</p>
                <p className="text-sm text-yellow-800">
                  Your verification request is being reviewed. This usually takes 24-48 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationStatus && verificationStatus.status === "approved" && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Verified</p>
                <p className="text-sm text-green-800">
                  Your identity has been verified. Enjoy premium features!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationStatus && verificationStatus.status === "rejected" && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Verification Rejected</p>
                <p className="text-sm text-red-800">
                  {verificationStatus.decisionReason || "Your verification could not be completed."}
                </p>
                <p className="text-sm text-red-700 mt-2">Please try again with clearer documents.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {(!verificationStatus || verificationStatus.status === "rejected") && (
          <div className="space-y-6">
            {/* ID Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="idType">Identity Document Type</Label>
              <Select value={idType} onValueChange={setIdType} disabled={loading}>
                <SelectTrigger id="idType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driver_license">Driver's License</SelectItem>
                  <SelectItem value="national_id">National ID Card</SelectItem>
                  <SelectItem value="government_id">Government ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ID Number */}
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                placeholder="Enter your ID number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* ID Document Upload */}
            <div className="space-y-2">
              <Label>ID Document</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "idDocument")}
                  className="hidden"
                  id="idDocument"
                  disabled={loading}
                />
                <label htmlFor="idDocument" className="cursor-pointer block">
                  {idDocumentPreview ? (
                    <div className="space-y-2">
                      <div className="relative w-32 h-32 mx-auto rounded overflow-hidden">
                        <img
                          src={idDocumentPreview}
                          alt="ID Document Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-primary">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload ID document</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Selfie Upload */}
            <div className="space-y-2">
              <Label>Selfie</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "selfie")}
                  className="hidden"
                  id="selfie"
                  disabled={loading}
                />
                <label htmlFor="selfie" className="cursor-pointer block">
                  {selfiePreview ? (
                    <div className="space-y-2">
                      <div className="relative w-32 h-32 mx-auto rounded overflow-hidden">
                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-primary">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload selfie</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Privacy Notice */}
            <Card className="border-border/50 bg-muted/50">
              <CardContent className="pt-4 text-sm">
                <p className="text-muted-foreground">
                  Your documents are encrypted and securely stored. We use them only for verification
                  purposes and comply with all privacy regulations.
                </p>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !idType || !idNumber || !idDocument || !selfie}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Submitting..." : "Submit Verification"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
