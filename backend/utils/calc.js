
function calculateSplit(totalPremium) {
  const GCV_INR = parseFloat(process.env.GCV_INR_RATE || 27645992);
  const piShareInr = totalPremium * 0.10;
  const inrShare = totalPremium * 0.90;
  const piAmount = piShareInr / GCV_INR;

  return {
    totalPremium,
    piShareInr: Math.round(piShareInr),
    inrShare: Math.round(inrShare),
    piAmount: parseFloat(piAmount.toFixed(7)), // Pi supports 7 decimals
    gcvRate: GCV_INR,
    gcvRateUSD: 314159
  };
}
module.exports = { calculateSplit };
