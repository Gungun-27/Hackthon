# TrafficMitra — City-Scale Deployment & Scalability Architecture Note

**Nagpur Municipal Corporation (NMC) & Nagpur Smart and Sustainable City Development Corporation Ltd. (NSSCDCL)**

---

## 1. City-Scale Operational Context
Nagpur has an urban population of ~3 million commuters across 10 administrative municipal zones and 14 major traffic divisions. Under peak operational conditions, the TrafficMitra platform is engineered to sustain:
- **Daily active citizen reports:** 2,500 – 6,000 complaints/day
- **Peak concurrent connections:** ~15,000 concurrent requests during storm events, monsoon waterlogging, or major festival corridors (e.g. Marbat, Dikshabhumi).
- **Sub-second SLA:** < 250ms API response time across 4G/5G mobile carriers.

---

## 2. Target Production Architecture

```
                                [ Cloudflare CDN / WAF ]
                                            │
                             [ Elastic Load Balancer (ALB) ]
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   │                                                 │
          [ ECS / K8s Pods ]                                [ ECS / K8s Pods ]
        (TrafficMitra App API)                            (TrafficMitra App API)
                   │                                                 │
                   ├────────────────────────┬────────────────────────┤
                   │                        │                        │
                   ▼                        ▼                        ▼
        [ Redis Cache Cluster ]  [ SQS / BullMQ Queues ]   [ Supabase / Aurora PG ]
        (Sessions, Rate Limits)  (Async AI & Transcode)    (Primary + Read Replicas)
                                            │                        │
                                            ▼                        ▼
                                   [ Worker Microservices ]   [ Nagpur ICCC Bus ]
                                   (LLM Triage & Tow Alerts) (CAD / GIS / E-Challan)
```

---

## 3. Integration with Nagpur Smart City ICCC (Integrated Command & Control Centre)

1. **GIS Layer Ingestion (OGC WMS/WFS)**:
   - TrafficMitra exposes complaint geo-coordinates and incident density heatmaps via standard GeoJSON / OGC WFS endpoints for direct ingestion onto the large-screen videowall GIS software at the Nagpur Smart City ICCC (Civil Lines).
2. **Police CAD & E-Challan Bridging**:
   - For validated parking violations with clear photographic number plate proof, the backend triggers an automated webhook to the Maharashtra Police Parivahan E-Challan gateway (NIC) under Section 133/177 of the Motor Vehicles Act.
3. **Automated Tow-Truck Fleet Dispatch**:
   - Towing requests flagged on TrafficMitra connect with NMC’s GPS-enabled towing cranes, transmitting nearest vehicle coordinates and photo proof to the driver's handheld terminal.

---

## 4. Scalability & High Availability Strategy

| Dimension | Engineering Implementation |
|---|---|
| **Database Scaling** | Multi-AZ AWS Aurora PostgreSQL with automated failover (< 30s) and read replicas for analytics queries. Spatial queries indexed via **PostGIS** (`ST_DWithin`, `ST_Point`). |
| **Media Handling** | Evidence images & dashcam videos uploaded directly via pre-signed URLs to S3/Cloudinary with WebP/H.264 transcoding workers. Zero disk strain on API nodes. |
| **AI LLM Resilience** | Circuit-breaker architecture: If Anthropic Claude / Gemini API experiences upstream latency > 2.5s, the system automatically falls back to internal heuristic rule-based severity scoring without blocking citizen submission. |
| **Data Retention & Audit** | Complaint status logs are immutable append-only records with cryptographic SHA-256 state hashes, ensuring tamper-proof legal evidentiary integrity for judicial or RTI inquiries. |

---

## 5. Cost-Realism & Budget Estimate (Per Month)

```
• Compute (AWS ECS / Container Service - 4 Tasks):            $120 / month
• Managed Database (Aurora PostgreSQL + 1 Read Replica):       $160 / month
• Media Storage & Egress (S3 / CloudFront - 1TB):               $45 / month
• LLM Reasoning (Anthropic / Gemini Pay-as-you-go tokens):      $50 / month
• Transactional SMS & Email (CDAC Gov Gateway / SendGrid):      $40 / month
────────────────────────────────────────────────────────────────────────────
Total Estimated Monthly Infrastructure Cost:                   ~$415 / month
```
*Extremely cost-effective civic tech deployment delivering institutional reliability for a tier-2 metropolitan city.*
