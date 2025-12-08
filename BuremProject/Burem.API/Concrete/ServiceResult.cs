using System.Text.Json.Serialization;

namespace Burem.API.Concrete
{
    // --- 1. BASE CLASS (Genel Sonuç) ---
    public class ServiceResult
    {
        // Ana Başarı Durumu (Property)
        public bool Success { get; set; }

        // HATA ÇÖZÜMÜ: Controller'da 'IsSuccess' kullanıldığı için eklendi.
        // Bu özellik, değerini 'Success' property'sinden alır.
        public bool IsSuccess => Success;

        public string Message { get; set; }

        // Bazı kodlarda 'ErrorMessage' kullanıldığı için eklendi.
        public string ErrorMessage => Message;

        public object Data { get; set; }
        public int StatusCode { get; set; }

        // --- STATİK METOTLAR ---

        // Metot adı: SuccessResult (Property ismiyle çakışmaması için)
        public static ServiceResult SuccessResult(string message = "", int statusCode = 200)
        {
            return new ServiceResult
            {
                Success = true,
                Message = message,
                StatusCode = statusCode,
                Data = null
            };
        }

        // Hatalı Sonuç Metodu
        public static ServiceResult Fail(string message, int statusCode = 400)
        {
            return new ServiceResult
            {
                Success = false,
                Message = message,
                StatusCode = statusCode,
                Data = null
            };
        }

        // 'Failure' çağrılarını 'Fail' metoduna yönlendiriyoruz (Eski kodlarla uyumluluk için)
        public static ServiceResult Failure(string message, int statusCode = 400) => Fail(message, statusCode);
    }

    // --- 2. GENERIC CLASS (Veri Döndüren Sonuç) ---
    public class ServiceResult<T> : ServiceResult
    {
        public new T Data
        {
            get => (T)base.Data;
            set => base.Data = value;
        }

        // Generic Success Metodu
        public static ServiceResult<T> SuccessResult(T data, string message = "", int statusCode = 200)
        {
            var result = new ServiceResult<T>();
            result.Success = true;
            result.Data = data;
            result.Message = message;
            result.StatusCode = statusCode;
            return result;
        }

        // Generic Fail Metodu
        public new static ServiceResult<T> Fail(string message, int statusCode = 400)
        {
            var result = new ServiceResult<T>();
            result.Success = false;
            result.Message = message;
            result.StatusCode = statusCode;
            return result;
        }

        // Uyumluluk için
        public new static ServiceResult<T> Failure(string message, int statusCode = 400) => Fail(message, statusCode);
    }
}