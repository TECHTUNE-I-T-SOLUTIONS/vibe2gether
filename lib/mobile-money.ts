export function normalizeMobileMoneyPhone(phoneNumber: string, countryCode: string) {
  let phone = String(phoneNumber || "").replace(/\D/g, "")
  const code = String(countryCode || "").replace(/\D/g, "")

  if (code && phone.startsWith(code)) {
    phone = phone.slice(code.length)
  }

  while (phone.startsWith("0") && code === "237") {
    phone = phone.slice(1)
  }

  return phone
}

export function getMobileMoneyFailureMessage(processorResponse: any, fallback = "Payment verification failed") {
  const type = String(processorResponse?.type || processorResponse?.code || "").toLowerCase()
  const message = processorResponse?.message || processorResponse?.description

  if (type.includes("invalid_phone") || type === "101") {
    return "Invalid mobile money number. Please confirm this is an active wallet on the selected network, enter the local number without the country code, and try again."
  }

  if (type.includes("insufficient")) {
    return "Insufficient mobile money balance. Please fund the wallet or try another payment method."
  }

  if (type.includes("timeout") || type.includes("expired")) {
    return "The mobile money approval expired. Please restart the payment and approve it on your phone."
  }

  if (type.includes("declined") || type.includes("rejected")) {
    return "The mobile money payment was declined. Please approve the prompt on your phone or try another wallet."
  }

  return message || fallback
}
