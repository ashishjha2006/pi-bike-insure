
// Pi SDK Loader
export const initPi = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.init({ version: '2.0', sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' });
      resolve(window.Pi);
    } else {
      // Load Pi SDK script
      const script = document.createElement('script');
      script.src = 'https://sdk.minepi.com/pi-sdk.js';
      script.onload = () => {
        window.Pi.init({ version: '2.0', sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' });
        resolve(window.Pi);
      };
      document.head.appendChild(script);
    }
  });
};

export const authenticatePi = async () => {
  const Pi = await initPi();
  const scopes = ['username', 'payments', 'wallet_address'];
  const auth = await Pi.authenticate(scopes, (payment) => {
    console.log('Incomplete payment found', payment);
  });
  return auth; // { user: { uid, username }, accessToken }
};

export const createPiPayment = async (piAmount, orderId, memo) => {
  const Pi = await initPi();
  return new Promise((resolve, reject) => {
    Pi.createPayment({
      amount: piAmount,
      memo: memo || 'Two Wheeler Insurance - 10% Pi Payment',
      metadata: { orderId },
    }, {
      onReadyForServerApproval: async (paymentId) => {
        console.log('Ready for approval', paymentId);
        // Call backend approve
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pi/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, orderId })
        });
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        console.log('Ready for completion', paymentId, txid);
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pi/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid, orderId })
        });
        resolve({ paymentId, txid });
      },
      onCancel: (paymentId) => {
        console.log('Payment cancelled', paymentId);
        reject('Cancelled');
      },
      onError: (error, payment) => {
        console.error('Payment error', error);
        reject(error);
      }
    });
  });
};
