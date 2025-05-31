import { NextResponse } from 'next/server';
import { loadAnubisConfig } from '@/lib/anubis/config';

// ANUBIS STATUS ENDPOINT
export async function GET() {
  try {
    const config = loadAnubisConfig();
    
    return NextResponse.json({
      enabled: config.enabled,
      difficulty: config.difficulty,
      bypassDevelopment: config.bypassDevelopment,
      environment: process.env.NODE_ENV || 'development',
      excludedRoutes: config.excludedRoutes.length,
      allowedUserAgents: config.allowedUserAgents.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Anubis status check error:', error);
    return NextResponse.json({
      enabled: false,
      error: 'Configuration error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 