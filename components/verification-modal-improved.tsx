import { useState, useEffect } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Upload, CheckCircle, Clock, AlertCircle, Loader2, X } from "lucide-react"

interface VerificationStatus {
  id?: string
  status: "pending" | "approved" | "rejected"
  idType?: string
  idNumber?: string
  idDocumentUrl?: string
  selfieUrl?: string
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
  // Initialize to false - will be set to true only if status hasn't loaded yet
  const [fetchingStatus, setFetchingStatus] = useState(false)
  const [idType, setIdType] = useState("passport")
  const [idNumber, setIdNumber] = useState("")
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [idDocumentPreview, setIdDocumentPreview] = useState<string>("")
  const [selfiePreview, setSelfiePreview] = useState<string>("")
  const [verificationState, setVerificationState] = useState<VerificationStatus | null>(null)

  // Form validation errors
  const [errors, setErrors] = useState<{
    idType?: string
    idNumber?: string
    idDocument?: string
    selfie?: string
  }>({})

  useEffect(() => {
    if (open) {
      // Only fetch if status hasn't been passed in
      if (!verificationStatus) {
        setFetchingStatus(true)
        fetchVerificationStatus()
      }
    }
  }, [open])

  useEffect(() => {
    if (verificationStatus) {
      setVerificationState(verificationStatus)
      setFetchingStatus(false)
    }
  }, [verificationStatus])

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch("/api/user/verification-status")
      if (response.ok) {
        const data = await response.json()
        setVerificationState(data)
      }
    } catch (error) {
      console.error("[Verification Modal] Error fetching status:", error)
    } finally {
      setFetchingStatus(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!idType) {
      newErrors.idType = "Please select an ID type"
    }

    if (!idNumber || idNumber.trim().length === 0) {
      newErrors.idNumber = "ID number is required"
    } else if (idNumber.trim().length < 5) {
      newErrors.idNumber = "ID number must be at least 5 characters"
    }

    if (!idDocument) {
      newErrors.idDocument = "ID document is required"
    }

    if (!selfie) {
      newErrors.selfie = "Selfie photo is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file or PDF",
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
        setErrors({ ...errors, idDocument: "" })
      } else {
        setSelfie(file)
        setSelfiePreview(preview)
        setErrors({ ...errors, selfie: "" })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdNumber(e.target.value)
    if (e.target.value.trim().length >= 5) {
      setErrors({ ...errors, idNumber: "" })
    }
  }

  const handleIdTypeChange = (value: string) => {
    setIdType(value)
    setErrors({ ...errors, idType: "" })
  }

  const removeFile = (type: "idDocument" | "selfie") => {
    if (type === "idDocument") {
      setIdDocument(null)
      setIdDocumentPreview("")
    } else {
      setSelfie(null)
      setSelfiePreview("")
    }
  }

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("idType", idType)
      formData.append("idNumber", idNumber.trim())
      if (idDocument) formData.append("idDocument", idDocument)
      if (selfie) formData.append("selfie", selfie)

      console.log("[Verification Modal] Submitting verification request")

      const response = await fetch("/api/user/submit-verification", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit verification")
      }

      const data = await response.json()
      console.log("[Verification Modal] Verification submitted successfully")

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted. We'll review it within 24-48 hours.",
      })

      // Reset form
      setIdType("passport")
      setIdNumber("")
      setIdDocument(null)
      setSelfie(null)
      setIdDocumentPreview("")
      setSelfiePreview("")
      setErrors({})

      onOpenChange(false)
      onVerificationSubmitted?.()
    } catch (err) {
      console.error("[Verification Modal] Error:", err)
      const errorMsg = err instanceof Error ? err.message : "Failed to submit verification"
      toast({
        title: "Submission Error",
        description: errorMsg + ". Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if form can be submitted
  const canSubmit = idType && idNumber && idDocument && selfie && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            Verify your identity to unlock premium features and build trust on the platform
          </DialogDescription>
        </DialogHeader>

        {fetchingStatus && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Loading verification status...</span>
          </div>
        )}

        {!fetchingStatus && verificationState && verificationState.status === "pending" && (
          <div className="space-y-4">
            <Alert className="border-yellow-500/50 bg-yellow-500 dark:bg-yellow-800/10">
              <Clock className="h-4 w-4 text-yellow-800 dark:text-yellow-300" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                <p className="font-semibold">Verification Pending Review</p>
                <p className="text-sm mt-1">
                  Your verification request is being reviewed. This usually takes 24-48 hours.
                </p>
              </AlertDescription>
            </Alert>

            {/* Show submitted information */}
            <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-yellow-300 dark:text-yellow-300">Submitted Information</CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  Review what you submitted for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-300">ID Type</Label>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 capitalize">
                      {verificationState.idType?.replace('_', ' ') || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-300">ID Number</Label>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                      {verificationState.idNumber || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Show document previews if available */}
                {(verificationState.idDocumentUrl || verificationState.selfieUrl) && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Uploaded Documents</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verificationState.idDocumentUrl && (
                        <div className="space-y-2">
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">ID Document</p>
                          <div className="relative w-full h-32 border border-yellow-300 rounded-lg overflow-hidden bg-white">
                            <img
                              src={verificationState.idDocumentUrl}
                              alt="ID Document"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center text-yellow-600 dark:text-yellow-300 text-sm">
                              <Upload className="w-6 h-6 mr-2" />
                              Document uploaded
                            </div>
                          </div>
                        </div>
                      )}
                      {verificationState.selfieUrl && (
                        <div className="space-y-2">
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Selfie Photo</p>
                          <div className="relative w-full h-32 border border-yellow-300 dark:border-yellow-700 rounded-lg overflow-hidden bg-white dark:bg-yellow-900/20">
                            <img
                              src={verificationState.selfieUrl}
                              alt="Selfie"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center text-yellow-600 dark:text-yellow-300 text-sm">
                              <Upload className="w-6 h-6 mr-2" />
                              Photo uploaded
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/10">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
                    You cannot submit a new verification request while one is pending review.
                    If you need to update your documents, please wait for the current review to complete.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        {!fetchingStatus && verificationState && verificationState.status === "approved" && (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-900/10">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
            <AlertDescription className="text-green-800 dark:text-green-300 text-sm">
              <p className="font-semibold">Verified</p>
              <p className="text-sm mt-1">
                Your identity has been verified. Enjoy all premium features!
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!fetchingStatus && verificationState && verificationState.status === "rejected" && (
          <Alert className="border-red-500/50 bg-red-50 dark:bg-red-300">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
            <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
              <p className="font-semibold">Verification Rejected</p>
              <p className="text-sm mt-1">
                {verificationState.decisionReason || "Your verification request was not approved."}
              </p>
              <p className="text-xs mt-2">You can resubmit with updated documents.</p>
            </AlertDescription>
          </Alert>
        )}

        {!fetchingStatus && (!verificationState || verificationState.status === "rejected") && (
          <div className="space-y-6">
            {/* ID Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="idType">
                ID Type <span className="text-red-500 dark:text-red-500">*</span>
              </Label>
              <Select value={idType} onValueChange={handleIdTypeChange}>
                <SelectTrigger id="idType" className={errors.idType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driver_license">Driver's License</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="international_passport">International Passport</SelectItem>
                </SelectContent>
              </Select>
              {errors.idType && <p className="text-sm text-red-500 dark:text-red-200">{errors.idType}</p>}
            </div>

            {/* ID Number Input */}
            <div className="space-y-2">
              <Label htmlFor="idNumber">
                ID Number <span className="text-red-500 dark:text-red-500">*</span>
              </Label>
              <Input
                id="idNumber"
                placeholder="Enter your ID number"
                value={idNumber}
                onChange={handleIdNumberChange}
                disabled={loading}
                className={errors.idNumber ? "border-red-500" : ""}
              />
              {errors.idNumber && <p className="text-sm text-red-500 dark:text-red-200">{errors.idNumber}</p>}
            </div>

            {/* ID Document Upload */}
            <div className="space-y-2">
              <Label>
                ID Document (Front Side) <span className="text-red-500 dark:text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition">
                {!idDocumentPreview ? (
                  <label className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "idDocument")}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={idDocumentPreview}
                        alt="ID Document Preview"
                        className="w-32 h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("idDocument")}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600">✓ Document selected</p>
                    <label className="text-xs text-blue-600 cursor-pointer hover:underline">
                      Change file
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "idDocument")}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              {errors.idDocument && <p className="text-sm text-red-500 dark:text-red-200">{errors.idDocument}</p>}
            </div>

            {/* Selfie Upload */}
            <div className="space-y-2">
              <Label>
                Selfie Photo <span className="text-red-500 dark:text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition">
                {!selfiePreview ? (
                  <label className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "selfie")}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={selfiePreview}
                        alt="Selfie Preview"
                        className="w-32 h-32 object-cover rounded-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("selfie")}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600">✓ Photo selected</p>
                    <label className="text-xs text-blue-600 cursor-pointer hover:underline dark:text-blue-300">
                      Change file
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "selfie")}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              {errors.selfie && <p className="text-sm text-red-500 dark:text-red-200">{errors.selfie}</p>}
            </div>

            {/* Info Message */}
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/10">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
                Make sure your documents are clear, well-lit, and fully visible. Verification typically takes 24-48 hours.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
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
