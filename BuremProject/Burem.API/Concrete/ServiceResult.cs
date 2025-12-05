namespace Burem.API.Concrete
{
    // --- 1. BASE CLASS (Genel Sonuç) ---
    public class ServiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
        public int StatusCode { get; set; }

        public bool IsSuccess => Success; // Ekstra kontrol property'si

        // Hata Metodu
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

        // Başarı Metodu (İsim Çakışmaması için SuccessResult yaptık)
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
    }

    // --- 2. GENERIC CLASS (Veri Döndüren Sonuç) ---
    public class ServiceResult<T> : ServiceResult
    {
        // Base Data'yı T tipiyle eziyoruz
        public new T Data
        {
            get => (T)base.Data;
            set => base.Data = value;
        }

        // HATA ÇÖZÜMÜ: Metodun adını 'Success' yerine 'SuccessResult' yaptık.
        // Artık 'Success' property'si ile karışmayacak.
        public static ServiceResult<T> SuccessResult(T data, string message = "", int statusCode = 200)
        {
            var result = new ServiceResult<T>();
            result.Success = true; // Artık burası kesinlikle property'dir
            result.Data = data;
            result.Message = message;
            result.StatusCode = statusCode;
            return result;
        }

        public new static ServiceResult<T> Fail(string message, int statusCode = 400)
        {
            var result = new ServiceResult<T>();
            result.Success = false;
            result.Message = message;
            result.StatusCode = statusCode;
            return result;
        }
    }
}