import React from 'react'
import { Button } from './ui/button'

type Props = {
    credits: number
}

const PricingToast = (props: Props) => {
  return (
    <div className="flex flex-col gap-2">
        <p>You don't have enough credits. Generation requires {props.credits} credits.</p>
        <Button 
        variant="outline" 
        size="sm" 
        onClick={() => window.location.href = '/pricing'}
        className="mt-2"
        >
        Get More Credits
        </Button>
  </div>
  )
}

export default PricingToast