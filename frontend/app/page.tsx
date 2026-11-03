
'use client'
import { useState } from 'react'
import { authenticatePi, createPiPayment } from '../lib/pi'

export default function Home() {
  const [piUser, setPiUser] = useState<any>(null)
  const [vehicleNo, setVehicleNo] = useState('')
  const [quotes, setQuotes] = useState<any[]>([])
  const [selectedQuote, setSelectedQuote] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [step, setStep] = useState(1)

  const loginPi = async () => {
    try {
      const auth = await authenticatePi()
      setPiUser(auth.user)
      alert(`Welcome ${auth.user.username}`)
    } catch(e){ alert('Pi Auth failed - Open in Pi Browser') }
  }

  const getQuotes = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turtlemint/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNumber: vehicleNo })
    })
    const data = await res.json()
    setQuotes(data.quotes)
    setStep(2)
  }

  const selectQuote = async (q:any) => {
    setSelectedQuote(q)
    // Create order with split calculation
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pi/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalPremium: q.premium,
        vehicleNumber: vehicleNo,
        vehicleDetails: { number: vehicleNo },
        quote: q,
        piUser
      })
    })
    const data = await res.json()
    setOrder({ orderId: data.orderId, ...data.split, quote: q })
    setStep(3)
  }

  const payPi = async () => {
    try {
      const result = await createPiPayment(order.piAmount, order.orderId, `Bike Insurance ${vehicleNo}`)
      alert(`Pi Payment Success! TX: ${result.txid}`)
      setStep(4)
    } catch(e){ alert('Pi Payment failed: '+e) }
  }

  const payINR = async () => {
    // Razorpay flow
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.orderId })
    })
    const { rzpOrderId, key } = await res.json()

    // @ts-ignore
    const rzp = new window.Razorpay({
      key,
      amount: order.inrShare * 100,
      currency: 'INR',
      name: 'Pi Bike Insure',
      description: `Insurance for ${vehicleNo}`,
      order_id: rzpOrderId,
      handler: async (response:any) => {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...response, orderId: order.orderId })
        })
        // Issue policy
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turtlemint/issue-policy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.orderId })
        })
        alert('Insurance Issued Successfully!')
        setStep(5)
      }
    })
    rzp.open()
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-4">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold">🏍️ Pi Bike Insure</h1>
        <p className="text-sm text-gray-500">Powered by Turtlemint | DSA</p>
        <div className="mt-2 text-xs bg-purple-100 p-2 rounded">GCV Rate: 1 Pi = $314,159 = {process.env.NEXT_PUBLIC_GCV_RATE} INR | Pay 10% Pi + 90% INR</div>
      </div>

      {!piUser ? (
        <button onClick={loginPi} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">Login with Pi Wallet</button>
      ) : (
        <div className="text-sm bg-green-50 p-2 rounded">Logged in as: {piUser.username}</div>
      )}

      {step === 1 && (
        <div className="mt-6">
          <input value={vehicleNo} onChange={e=>setVehicleNo(e.target.value.toUpperCase())} placeholder="GJ05 AB 1234" className="w-full border p-3 rounded-xl" />
          <button onClick={getQuotes} className="w-full mt-3 bg-black text-white py-3 rounded-xl">Get Insurance Quotes</button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-3">
          {quotes.map((q,i)=>(
            <div key={i} onClick={()=>selectQuote(q)} className="border p-3 rounded-xl flex justify-between cursor-pointer hover:bg-gray-50">
              <div><div className="font-bold">{q.company}</div><div className="text-xs">IDV: ₹{q.idv}</div></div>
              <div className="font-bold">₹{q.premium}</div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && order && (
        <div className="mt-4 border rounded-xl p-4 space-y-2">
          <h3 className="font-bold">Payment Split</h3>
          <div className="text-sm flex justify-between"><span>Total Premium:</span><span>₹{order.totalPremium}</span></div>
          <div className="text-sm flex justify-between text-purple-600 font-bold"><span>10% Pi (GCV):</span><span>{order.piAmount} Pi (~₹{order.piShareInr})</span></div>
          <div className="text-sm flex justify-between"><span>90% INR:</span><span>₹{order.inrShare}</span></div>
          <div className="text-xs text-gray-500">Merchant Wallet: G... (Pi) | Bank: Your Bank (INR)</div>
          <button onClick={payPi} className="w-full bg-purple-600 text-white py-3 rounded-xl mt-3">Pay {order.piAmount} Pi Now</button>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 border rounded-xl p-4">
          <div className="text-green-600 font-bold">✅ Pi Payment Done</div>
          <p className="text-sm mt-2">Now pay remaining ₹{order.inrShare} via UPI/Razorpay to your bank account</p>
          <button onClick={payINR} className="w-full bg-blue-600 text-white py-3 rounded-xl mt-3">Pay ₹{order.inrShare} INR</button>
        </div>
      )}

      {step === 5 && (
        <div className="mt-4 bg-green-100 p-6 rounded-xl text-center">
          <h2 className="text-xl font-bold">🎉 Policy Issued!</h2>
          <p className="text-sm mt-2">Vehicle: {vehicleNo}</p>
          <p className="text-xs mt-2">Pi TX received in your merchant wallet + INR received in your bank</p>
        </div>
      )}
    </div>
  )
}
