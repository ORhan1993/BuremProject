using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Burem.API.Helpers
{
    public static class CryptoHelper
    {
        // Eski projenizdeki Crypto.cs dosyasından alınan SALT değeri (Sabit)
        private static readonly byte[] _salt = Encoding.ASCII.GetBytes("akS5D3q94sr9huo");

        // Eski projenizdeki Security.cs dosyasından alınan ORTAK ANAHTAR (Şifre)
        // DİKKAT: Bu değer değişirse eski verileri çözemezsiniz.
        private static readonly string _sharedSecret = "CRn9cNujr3nKvYSY";

        public static string Decrypt(string encryptedValue)
        {
            // Boş veya null gelirse boş dön
            if (string.IsNullOrEmpty(encryptedValue) || encryptedValue == "empty") return "";

            try
            {
                // Base64 stringi byte dizisine çevir
                byte[] cipherTextBytes = Convert.FromBase64String(encryptedValue);

                // Anahtarı türet (Eski projeyle aynı parametreler: Secret + Salt)
                // Not: Eski proje varsayılan olarak 1000 iterasyon ve SHA1 kullanıyor, bu constructor bunu sağlar.
                using (var rfc = new Rfc2898DeriveBytes(_sharedSecret, _salt))
                {
                    // RijndaelManaged (eski) 256 bit key kullanıyordu (32 byte)
                    byte[] key = rfc.GetBytes(32);

                    using (MemoryStream ms = new MemoryStream(cipherTextBytes))
                    {
                        // Eski formatta şifreli verinin başında IV uzunluğu ve IV'nin kendisi var.
                        // Onu okuyup stream'i asıl verinin olduğu yere getiriyoruz.
                        byte[] iv = ReadByteArray(ms);

                        // .NET Core için AES (Rijndael uyumlu)
                        using (Aes aes = Aes.Create())
                        {
                            aes.Key = key;
                            aes.IV = iv;
                            aes.Mode = CipherMode.CBC; // Eski varsayılan
                            aes.Padding = PaddingMode.PKCS7; // Eski varsayılan

                            // Şifre çözme işlemi
                            using (ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV))
                            using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                            using (StreamReader sr = new StreamReader(cs))
                            {
                                return sr.ReadToEnd();
                            }
                        }
                    }
                }
            }
            catch
            {
                // Eğer şifre çözülemezse (örn: veri zaten düz metinse veya bozuksa)
                // orijinal değeri geri döndür. Böylece "Ayşe" gibi şifresiz veriler kaybolmaz.
                return encryptedValue;
            }
        }

        public static string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return "";

            try
            {
                using (var rfc = new Rfc2898DeriveBytes(_sharedSecret, _salt))
                {
                    // Anahtar ve IV türetme (Eski projeyle aynı)
                    byte[] key = rfc.GetBytes(32);
                    byte[] iv = rfc.GetBytes(16); // 128 bit blok boyutu için 16 byte

                    using (Aes aes = Aes.Create())
                    {
                        aes.Key = key;
                        aes.IV = iv;

                        using (MemoryStream ms = new MemoryStream())
                        {
                            // 1. IV Uzunluğunu Yaz (4 byte int)
                            ms.Write(BitConverter.GetBytes(iv.Length), 0, 4);

                            // 2. IV'nin Kendisini Yaz
                            ms.Write(iv, 0, iv.Length);

                            // 3. Şifreli Veriyi Yaz
                            using (ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV))
                            using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                            using (StreamWriter sw = new StreamWriter(cs))
                            {
                                sw.Write(plainText);
                            }

                            return Convert.ToBase64String(ms.ToArray());
                        }
                    }
                }
            }
            catch
            {
                return "";
            }
        }

        // Eski projenizdeki ReadByteArray metodunun aynısı (Stream'den IV okumak için)
        private static byte[] ReadByteArray(Stream s)
        {
            byte[] lengthBytes = new byte[4];
            // Önce 4 byte (integer) uzunluk bilgisini oku
            if (s.Read(lengthBytes, 0, 4) != 4)
            {
                throw new SystemException("Stream formatı hatalı: IV uzunluğu okunamadı.");
            }

            int length = BitConverter.ToInt32(lengthBytes, 0);

            // O uzunluk kadar byte oku (IV verisi)
            byte[] buffer = new byte[length];
            if (s.Read(buffer, 0, length) != length)
            {
                throw new SystemException("Stream formatı hatalı: IV verisi okunamadı.");
            }

            return buffer;
        }
    }
}