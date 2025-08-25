import bcrypt from "bcryptjs";

export const generateHash = async (
  { plaintext = "", saltRound = process.env.SALT || "10" } = {}
): Promise<string> => {
  return bcrypt.hashSync(plaintext, parseInt(saltRound));
};


export const compareHash = async (
  { plaintext, hashValue }: { plaintext: string; hashValue?: string | null }
): Promise<boolean> => {
  if (!hashValue) return false;
  return bcrypt.compare(plaintext, hashValue);
};
