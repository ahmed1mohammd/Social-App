
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


export const otpExpiryDate = () => new Date(Date.now() + 2 * 60 * 1000);
