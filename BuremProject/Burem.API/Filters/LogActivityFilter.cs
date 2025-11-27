using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Burem.API.Abstract;

namespace Burem.API.Filters
{
    public class LogActivityFilter : IAsyncActionFilter
    {
        private readonly ISecurityService _securityService;

        // Dependency Injection ile mevcut servisinizi alıyoruz
        public LogActivityFilter(ISecurityService securityService)
        {
            _securityService = securityService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // 1. İşlem (Action) çalışmadan önceki verileri alıyoruz
            var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
            string controllerName = descriptor?.ControllerName ?? "Bilinmeyen";
            string actionName = descriptor?.ActionName ?? "Bilinmeyen";

            // Eğer istekte bir "id" parametresi varsa onu yakalayalım (Log mesajını zenginleştirmek için)
            string idParam = "";
            if (context.ActionArguments.ContainsKey("id"))
            {
                idParam = $" - ID: {context.ActionArguments["id"]}";
            }
            else if (context.ActionArguments.ContainsKey("sessionId"))
            {
                idParam = $" - SessionID: {context.ActionArguments["sessionId"]}";
            }

            // 2. Action çalıştırılıyor (Controller içindeki kodlar burada çalışır)
            var resultContext = await next();

            // 3. İşlem bittikten sonra hata yoksa logluyoruz
            if (resultContext.Exception == null)
            {
                // Örn Mesaj: "Students/GetStudentById işlemi tamamlandı. - ID: 5"
                string logMessage = $"{controllerName}/{actionName} işlemi tamamlandı.{idParam}";

                // Sizin mevcut loglama yapınızı kullanıyoruz
                _securityService.AddLog(logMessage);
            }
        }
    }
}