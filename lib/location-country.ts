import { COUNTRIES } from "@/lib/countries"

const DEFAULT_COUNTRY_CODE = "NG"

const COUNTRY_ALIASES: Record<string, string> = {
  nigeria: "NG",
  nigerian: "NG",
  usa: "US",
  "u s a": "US",
  us: "US",
  "u s": "US",
  "united states": "US",
  "united states of america": "US",
  uk: "GB",
  "u k": "GB",
  britain: "GB",
  "great britain": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "united kingdom": "GB",
  uae: "AE",
  "u a e": "AE",
  "united arab emirates": "AE",
  "south korea": "KR",
  korea: "KR",
  "cote d'ivoire": "CI",
  "cote divoire": "CI",
  "ivory coast": "CI",
  "czechia": "CZ",
}

type CountryInfo = {
  code: string
  name: string
  flag: string
}

function normalizeLocationPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const normalizedCountries = COUNTRIES.map((country) => ({
  ...country,
  normalizedName: normalizeLocationPart(country.name),
}))

function getCountryByCode(code: string): CountryInfo {
  return (
    normalizedCountries.find((country) => country.code === code) ??
    normalizedCountries.find((country) => country.code === DEFAULT_COUNTRY_CODE)!
  )
}

export function resolveCountryFromLocation(locationName?: string | null): CountryInfo {
  if (!locationName?.trim()) {
    return getCountryByCode(DEFAULT_COUNTRY_CODE)
  }

  const normalizedLocation = normalizeLocationPart(locationName)
  const commaSeparatedParts = locationName
    .split(",")
    .map((part) => normalizeLocationPart(part))
    .filter(Boolean)

  for (const part of [...commaSeparatedParts].reverse()) {
    const aliasCode = COUNTRY_ALIASES[part]
    if (aliasCode) {
      return getCountryByCode(aliasCode)
    }

    const exactMatch = normalizedCountries.find((country) => country.normalizedName === part)
    if (exactMatch) {
      return exactMatch
    }
  }

  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (
      normalizedLocation === alias ||
      normalizedLocation.endsWith(` ${alias}`) ||
      normalizedLocation.includes(` ${alias} `)
    ) {
      return getCountryByCode(code)
    }
  }

  for (const country of normalizedCountries) {
    if (
      normalizedLocation === country.normalizedName ||
      normalizedLocation.endsWith(` ${country.normalizedName}`) ||
      normalizedLocation.includes(` ${country.normalizedName} `)
    ) {
      return country
    }
  }

  return getCountryByCode(DEFAULT_COUNTRY_CODE)
}

export function getFlagFromLocation(locationName?: string | null) {
  return resolveCountryFromLocation(locationName).flag
}

export function getFlagAssetFromLocation(locationName?: string | null) {
  const country = resolveCountryFromLocation(locationName)
  return {
    code: country.code,
    name: country.name,
    src: `/svg/${country.code.toLowerCase()}.svg`,
  }
}
