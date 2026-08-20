import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import authRoutes from './routes/authRoutes';
import complaintRoutes from './routes/complaintRoutes';
import authorityRoutes from './routes/authorityRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import chatbotRoutes from './routes/chatbotRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Tables
initDatabase();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/authority/analytics', analyticsRoutes);
app.use('/api/authority', authorityRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Root & API Welcome / Status Dashboard
app.get(['/', '/api'], (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>TrafficMitra API — Nagpur Municipal & Traffic Police</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b132b; color: #f8fafc; margin: 0; padding: 40px 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #1c2541; border: 1px solid #3a506b; border-radius: 12px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        .badge { background: #065f46; color: #34d399; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; font-family: monospace; }
        h1 { margin: 12px 0 6px 0; font-size: 26px; color: #ffffff; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-top: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 24px 0; }
        .card { background: #0b132b; border: 1px solid #3a506b; border-radius: 8px; padding: 16px; }
        .card-title { font-size: 12px; color: #f59e0b; font-weight: bold; text-transform: uppercase; font-family: monospace; margin-bottom: 6px; }
        .card-desc { font-size: 12px; color: #cbd5e1; }
        .btn { display: inline-block; background: #f59e0b; color: #0b132b; font-weight: bold; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-right: 12px; transition: 0.2s; }
        .btn:hover { background: #d97706; }
        .btn-outline { background: transparent; color: #f8fafc; border: 1px solid #475569; }
        .btn-outline:hover { background: #3a506b; }
        ul { padding-left: 20px; font-size: 13px; color: #94a3b8; line-height: 1.8; }
        code { background: #0b132b; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">● REST API Server Online</span>
        <h1>TrafficMitra Backend Service</h1>
        <p>Official REST API for Nagpur Municipal Corporation & Nagpur Traffic Police Civic Reporting Grid.</p>
        
        <div style="margin: 24px 0;">
          <a href="http://localhost:5173" class="btn">Launch Frontend Web Portal (Port 5173) →</a>
          <a href="/api/health" class="btn btn-outline">Check Health JSON</a>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">📡 API Health</div>
            <div class="card-desc">Status: <strong style="color: #34d399;">200 OK</strong><br>Timestamp: ${new Date().toLocaleTimeString()}</div>
          </div>
          <div class="card">
            <div class="card-title">🏛️ Database Engine</div>
            <div class="card-desc">SQLite WAL + Foreign Keys Enabled<br>Realistic Nagpur Dataset Seeded</div>
          </div>
          <div class="card">
            <div class="card-title">🤖 LLM Triage Service</div>
            <div class="card-desc">Prompts: Section 10 Implemented<br>AI Severity &amp; Chatbot Ready</div>
          </div>
        </div>

        <h3 style="font-size: 16px; color: #ffffff; margin-top: 24px;">Core API Routes:</h3>
        <ul>
          <li><code>GET /api/health</code> — Health and status verification</li>
          <li><code>POST /api/auth/login</code> — Citizen &amp; Officer JWT Authentication</li>
          <li><code>POST /api/complaints/ai-assist</code> — Live AI description &amp; severity score</li>
          <li><code>GET /api/complaints/TM-2026-004521</code> — Public ticket audit timeline lookup</li>
          <li><code>GET /api/authority/analytics/summary</code> — City-wide operational metrics</li>
          <li><code>GET /api/authority/analytics/heatmap</code> — Spatial density coordinates</li>
          <li><code>POST /api/chatbot/message</code> — Live database ticket conversational assistant</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'TrafficMitra Backend API',
    authority: 'Nagpur Municipal Corporation & Nagpur Traffic Police',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TrafficMitra Server running at http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
});
