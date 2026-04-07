## 1. PRODUCT CONTEXT

**Product Name:** FlyCheap AI

**Type:** AI-powered flight deal discovery system

**Core Objective:**

Detect, analyze, and recommend abnormal cheap flight opportunities globally.

---

## 2. CORE SYSTEM MODULES

```
1. Data Collection Layer
2. Price Intelligence Engine
3. Route Optimization Engine
4. Cost Analysis Engine
5. Decision Engine
6. Alert System
7. User Interface Layer
```

---

# 🧩 MODULE 1 — DATA COLLECTION

## 1.1. Feature: Flight Price Fetching

### Description

Collect flight price data from multiple sources.

### Input

```
- origin (e.g. HAN)
- destination (e.g. ICN)
- date_range (next 180 days)
```

### Output

```
{
  route: "HAN-ICN",
  date: "2026-06-12",
  price: 210,
  airline: "VietJet",
  stops: 0,
  duration: "4h30",
  timestamp: "ISO"
}
```

### Logic

- Fetch daily or every 6 hours
- Store historical price

### Priority: 🔴 HIGH

---

## 1.2. Feature: Multi-source Aggregation

### Description

Merge data from:

- OTA
- Airline websites
- Meta search

### Logic

- Remove duplicates
- Normalize currency

### Priority: 🟠 MEDIUM

---

# 🧠 MODULE 2 — PRICE INTELLIGENCE ENGINE

---

## 2.1. Feature: Deal Detection

### Description

Detect abnormal price drops.

### Input

```
price_today
avg_price_7_days
avg_price_30_days
```

### Output

```
{
  is_deal: true,
  discount_percent: 32,
  confidence: 0.87
}
```

### Logic

```
if price_today < avg_7d * 0.8 → deal
if price_today < avg_30d * 0.7 → strong deal
```

### Priority: 🔴 HIGH

---

## 2.2. Feature: Seasonality Analysis

### Description

Analyze price trend by time

### Output

```
{
  best_days: ["Tuesday", "Wednesday"],
  avg_saving_percent: 18
}
```

### Logic

- Group price by weekday
- Compare avg

### Priority: 🟠 MEDIUM

---

## 2.3. Feature: Price Explanation (AI)

### Description

Explain WHY price is low.

### Input

```
route
price_drop_percent
season
airline
```

### Output

```
"Price is lower due to low travel demand in June and airline promotional campaign."
```

### Priority: 🔴 HIGH

---

# ✈️ MODULE 3 — ROUTE OPTIMIZATION

---

## 3.1. Feature: Multi-leg Routing

### Description

Split route to reduce cost.

### Input

```
origin: HAN
destination: PAR
```

### Output

```
[
  { leg: "HAN-PVG", price: 120 },
  { leg: "PVG-PAR", price: 350 }
]
total_price: 470
```

### Logic

- Check hub cities:
    - PVG, ICN, TPE, NRT
- Compare:
direct vs split

### Priority: 🔴 HIGH

---

## 3.2. Feature: Virtual Interlining

### Description

Combine flights from different airlines without alliance.

### Risk Output

```
{
  self_transfer: true,
  risk_level: "medium"
}
```

### Priority: 🟠 MEDIUM

---

## 3.3. Feature: Hidden City (Opt-in)

### Description

Suggest hidden city ticketing.

### Warning (Required)

```
"Risk: airline may penalize or cancel return ticket."
```

### Priority: 🟡 LOW

---

# 💸 MODULE 4 — COST ANALYSIS

---

## 4.1. Feature: Hidden Fee Breakdown

### Description

Calculate real cost of low-cost flights.

### Input

```
base_price: 89
```

### Output

```
{
  base: 89,
  baggage: 40,
  seat: 15,
  payment_fee: 10,
  total: 154
}
```

### Priority: 🔴 HIGH

---

## 4.2. Feature: True Price Comparison

### Description

Compare airlines after full cost.

### Output

```
{
  cheapest_real_option: "Vietnam Airlines",
  reason: "includes baggage"
}
```

### Priority: 🟠 MEDIUM

---

# 🔁 MODULE 5 — DECISION ENGINE

---

## 5.1. Feature: Buy Recommendation

### Description

Suggest whether to buy or wait.

### Input

```
price_trend
deal_score
seasonality
```

### Output

```
{
  action: "BUY_NOW",
  confidence: 0.82,
  reason: "price is near lowest historical level"
}
```

### Priority: 🔴 HIGH

---

## 5.2. Feature: Refund vs Non-refundable

### Output

```
{
  recommended: "non-refundable",
  reason: "low risk + stable plan"
}
```

### Priority: 🟡 LOW

---

# 🔔 MODULE 6 — ALERT SYSTEM

---

## 6.1. Feature: Deal Alert

### Trigger

```
if deal_score > threshold
```

### Output (message)

```
🔥 Deal Alert
Route: HAN → ICN
Price: 2.1M (-35%)
Recommendation: Buy now
```

### Channels

- Telegram
- Email

### Priority: 🔴 HIGH

---

## 6.2. Feature: Personalized Alert

### Input

```
budget
region
travel_window
```

### Priority: 🟠 MEDIUM

---

# 🌐 MODULE 7 — UI / EXPERIENCE

---

## 7.1. Feature: Deal Feed

### Show

- best deals
- sorted by deal_score

---

## 7.2. Feature: Deal Detail Page

### Show

- price breakdown
- explanation
- route options
- risk

---

## 7.3. Feature: Explore Mode

### Show

- “Where can I go cheap now?”

---

## 7.4. Feature: Alert Subscription

---

# 📊 CORE DATA STRUCTURE

---

## Table: flights

```
id
origin
destination
date
price
airline
stops
duration
timestamp
```

---

## Table: deals

```
id
route
date
price
discount_percent
deal_score
created_at
```

---

## Table: users (optional v2)

---

# 🧠 CORE METRICS

```
deal_score
risk_score
price_drop_percent
confidence
```

---

# 🔥 PRIORITY SUMMARY

## MUST HAVE (build first)

- price fetching
- deal detection
- AI explanation
- alert system
- basic routing

## NICE TO HAVE

- hidden cost
- multi-leg optimization

## ADVANCED

- hidden city
- personalization

---

# ⚠️ NOTE CHO AI (IMPORTANT)

Khi AI đọc spec này:

- KHÔNG tự tạo dữ liệu giả
- CHỈ phân tích trên dữ liệu thật
- Luôn trả về:
    - reason
    - confidence
- Nếu thiếu data → phải nói rõ