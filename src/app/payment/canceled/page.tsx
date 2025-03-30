"use client";

import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentCanceled() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-gray-50 p-8 rounded-lg text-center max-w-md">
        <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Payment Canceled</h1>
        <p className="text-gray-600 mb-6">
          Your payment process was canceled. No charges were made. You can try again whenever you're ready.
        </p>
        <div className="space-y-3">
          <Link href="/#pricing">
            <Button className="w-full">Return to Pricing</Button>
          </Link>
          <Link href="/support">
            <Button variant="outline" className="w-full">Need Help?</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}