import crypto from "crypto";

const algorithm = "aes-256-gcm";
const secretKey = process.env.PHONE_ENCRYPTION_KEY || "your-32-character-secret-key-here!";
const ivLength = 16;

export const encryptPhone = (phone: string): string => {
  try {
    const iv = crypto.randomBytes(ivLength);
    const key = crypto.scryptSync(secretKey, "salt", 32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(phone, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Error encrypting phone:", error);
    throw new Error("Failed to encrypt phone number");
  }
};

export const decryptPhone = (encryptedPhone: string): string => {
  try {
    const parts = encryptedPhone.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted phone format");
    }
    
    const iv = Buffer.from(parts[0]!, "hex");
    const authTag = Buffer.from(parts[1]!, "hex");
    const encrypted = parts[2]!;
    
    const key = crypto.scryptSync(secretKey, "salt", 32);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Error decrypting phone:", error);
    throw new Error("Failed to decrypt phone number");
  }
};

export const isEncryptedPhone = (phone: string): boolean => {
  return phone.includes(":") && phone.split(":").length === 3;
};
