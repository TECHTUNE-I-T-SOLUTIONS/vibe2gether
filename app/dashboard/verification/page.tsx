"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function VerificationPage() {
  const [idType, setIdType] = useState('national_id')
  const [idNumber, setIdNumber] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!idFile || !selfieFile || !idNumber) return alert('Please complete all fields')
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('idType', idType)
      formData.append('idNumber', idNumber)
      formData.append('idDocument', idFile)
      formData.append('selfie', selfieFile)

      console.log('[Verification Page] Submitting verification with:', {
        idType,
        idNumber: '***',
        hasIdDocument: !!idFile,
        hasSelfie: !!selfieFile,
      })

      const res = await fetch('/api/user/submit-verification', { method: 'POST', body: formData })
      const json = await res.json()
      if (res.ok) {
        setStatus(json.status)
        // navigate to profile or show success
        setTimeout(() => router.push('/dashboard/profile'), 1500)
      } else {
        setStatus(json.error || 'Failed')
      }
    } catch (err) {
      console.error(err)
      setStatus('Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle>Get Verified</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Upload your ID/passport and a selfie to get verified. We do an automatic check and will notify you of the decision.</p>

          <div>
            <Label>ID Type</Label>
            <select value={idType} onChange={(e) => setIdType(e.target.value)} className="mt-1.5 w-full rounded-md border px-3 py-2">
              <option value="national_id">National ID / NIN</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>

          <div>
            <Label>ID Number</Label>
            <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Upload ID Document</Label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="mt-1.5" />
          </div>

          <div>
            <Label>Upload Selfie</Label>
            <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} className="mt-1.5" />
          </div>

          <div className="flex items-center gap-2">
            <Button className="rounded-full gradient-bg" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for verification'}
            </Button>
            {status && <span className="text-sm text-muted-foreground">Status: {status}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
