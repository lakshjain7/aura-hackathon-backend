import { useState, useCallback } from 'react'
import { generateComplaintId } from '../utils/formatters'

export function useComplaintForm() {
  const [form, setForm] = useState({
    text: '',
    language: 'en',
    photo: null,
    photoPreview: null,
    hasGPS: false,
    latitude: null,
    longitude: null,
    pincode: '',
    areaName: '',
    severity: null,
  })
  const [step, setStep] = useState(1) // 1=text, 2=location, 3=urgency
  const [submitting, setSubmitting] = useState(false)
  const [complaintId, setComplaintId] = useState(null)

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handlePhotoUpload = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      updateField('photoPreview', e.target.result)
      updateField('photo', file)
    }
    reader.readAsDataURL(file)
  }, [updateField])

  const handleGetLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            hasGPS: true,
          }))
        },
        () => {
          // Location denied - user can enter manually
        }
      )
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    const id = generateComplaintId()
    setComplaintId(id)
    setSubmitting(false)
    return id
  }, [])

  const prefill = useCallback((data) => {
    setForm(prev => ({
      ...prev,
      text: data.text,
      language: data.lang,
      pincode: data.pincode || '',
      areaName: data.location || '',
    }))
    if (data.pincode) setStep(2)
  }, [])

  return {
    form,
    step,
    setStep,
    submitting,
    complaintId,
    updateField,
    handlePhotoUpload,
    handleGetLocation,
    handleSubmit,
    prefill,
  }
}
