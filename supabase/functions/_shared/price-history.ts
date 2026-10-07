/**
 * Pure SHA-256 Hex Digest Implementation
 * Synchronous and universal across Node, Deno, and Browser environments.
 */
export function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = "length";
  let i: number, j: number;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += "\x80";
  while (ascii.length % 64 - 56) ascii += "\x00";
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = asciiBitLength | 0;
  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] = (i < 16)
          ? w[i]
          : (w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = a;
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

export type FlightObservation = {
  id?: string | null;
  origin_code?: string | null;
  destination_code?: string | null;
  date?: string | null;
  return_date?: string | null;
  price?: number | string | null;
  timestamp?: string | null;
  observed_at?: string | null;
  airline?: string | null;
  airline_code?: string | null;
  flight_number?: string | null;
  stops?: number | null;
  duration?: string | number | null;
  currency?: string | null;
  source?: string | null;
  scan_run_id?: string | null;
  itinerary_key?: string | null;
};

export type PriceHistoryRow = {
  from_code: string;
  to_code: string;
  date: string;
  price: number;
};

export type FareObservationRow = {
  observation_schema_version: number;
  provider: string;
  source_observation_id: string | null;
  scan_run_id: string | null;
  offer_variant_id: string;
  observation_fingerprint: string;
  observed_at: string;
  origin_airport: string;
  destination_airport: string;
  depart_local_date: string;
  return_local_date: string | null;
  journey_type: string;
  cabin: string;
  adults: number;
  children: number;
  infants: number;
  pricing_unit: string;
  currency: string;
  price: number;
  stops: number;
  duration_minutes: number | null;
  airline: string | null;
  airline_code: string | null;
  flight_number: string | null;
  source_quality: string;
};

export function toPriceHistoryRow(flight: FlightObservation): PriceHistoryRow | undefined {
  const price = Number(flight.price);
  const observedTimestamp = typeof flight.timestamp === "string" && flight.timestamp
    ? flight.timestamp
    : typeof flight.observed_at === "string" && flight.observed_at
      ? flight.observed_at
      : null;

  let rowDate: string | undefined;
  if (observedTimestamp) {
    const parsed = new Date(observedTimestamp);
    if (!Number.isNaN(parsed.getTime())) {
      rowDate = parsed.toISOString().slice(0, 10);
    }
  }
  if (!rowDate) {
    const flightDate = typeof flight.date === "string" ? new Date(`${flight.date}T00:00:00Z`) : null;
    if (
      typeof flight.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(flight.date) &&
      flightDate &&
      flightDate.toISOString().slice(0, 10) === flight.date
    ) {
      rowDate = flight.date;
    }
  }

  if (
    typeof flight.origin_code !== "string" || !flight.origin_code ||
    typeof flight.destination_code !== "string" || !flight.destination_code ||
    !rowDate ||
    !Number.isFinite(price) || price <= 0
  ) return undefined;
  return { from_code: flight.origin_code, to_code: flight.destination_code, date: rowDate, price };
}

/**
 * Maps a raw flight observation into a canonical, immutable FareObservationRow (REQ-HIST-005..007).
 * OfferVariant ID does NOT contain price.
 * Observation fingerprint deterministically captures provider observation event.
 */
export function toFareObservationRow(flight: FlightObservation): FareObservationRow | undefined {
  const price = Number(flight.price);
  if (!Number.isFinite(price) || price <= 0) return undefined;

  const origin = (flight.origin_code || "").trim().toUpperCase();
  const destination = (flight.destination_code || "").trim().toUpperCase();
  if (!origin || !destination) return undefined;

  const departDate = typeof flight.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(flight.date)
    ? flight.date
    : null;
  if (!departDate) return undefined;

  const returnDate = typeof flight.return_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(flight.return_date)
    ? flight.return_date
    : null;

  const observedTimestamp = typeof flight.timestamp === "string" && flight.timestamp
    ? flight.timestamp
    : typeof flight.observed_at === "string" && flight.observed_at
      ? flight.observed_at
      : new Date().toISOString();

  const provider = (flight.source || "fast_flights").trim().toLowerCase();
  const airline = (flight.airline || "").trim() || null;
  const airlineCode = (flight.airline_code || "").trim().toUpperCase() || null;
  const flightNumber = (flight.flight_number || "").trim().toUpperCase() || null;
  const stops = Math.max(0, Number(flight.stops ?? 0));
  const cabin = "ECONOMY";
  const currency = (flight.currency || "VND").trim().toUpperCase();
  const journeyType = returnDate ? "ROUND_TRIP" : "ONE_WAY";

  // Parse duration if available
  let durationMinutes: number | null = null;
  if (typeof flight.duration === "number") {
    durationMinutes = flight.duration;
  } else if (typeof flight.duration === "string") {
    const match = flight.duration.match(/(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:inutes?)?)?/i);
    if (match && (match[1] || match[2])) {
      durationMinutes = (parseInt(match[1] || "0", 10) * 60) + parseInt(match[2] || "0", 10);
    }
  }

  // Canonical OfferVariant ID (price excluded per REQ-ID-002)
  const variantParts = [
    origin,
    destination,
    departDate,
    returnDate || "",
    airlineCode || "",
    flightNumber || "",
    cabin,
    String(stops),
  ].join("|");
  const offerVariantId = `ov:v1:${sha256Hex(variantParts).slice(0, 32)}`;

  // Observation fingerprint for idempotent deduplication (REQ-HIST-005)
  const fingerprintParts = [
    provider,
    flight.scan_run_id || "",
    offerVariantId,
    observedTimestamp,
    String(price),
    currency,
  ].join("|");
  const observationFingerprint = sha256Hex(fingerprintParts);

  return {
    observation_schema_version: 1,
    provider,
    source_observation_id: flight.id || null,
    scan_run_id: flight.scan_run_id || null,
    offer_variant_id: offerVariantId,
    observation_fingerprint: observationFingerprint,
    observed_at: observedTimestamp,
    origin_airport: origin,
    destination_airport: destination,
    depart_local_date: departDate,
    return_local_date: returnDate,
    journey_type: journeyType,
    cabin,
    adults: 1,
    children: 0,
    infants: 0,
    pricing_unit: "PER_TRAVELER",
    currency,
    price,
    stops,
    duration_minutes: durationMinutes,
    airline,
    airline_code: airlineCode,
    flight_number: flightNumber,
    source_quality: "PROVEN_PROVIDER",
  };
}
