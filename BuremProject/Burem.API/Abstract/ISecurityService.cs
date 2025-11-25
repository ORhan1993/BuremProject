using Burem.Data.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;


namespace Burem.API.Abstract
{
    // Servis Arayüzü (Dependency Injection için)
    public interface ISecurityService
    {
        void AddLog(string actionToSave);
        // Şifreleme için sharedSecret'ı property olarak tutabiliriz
        string SharedSecret { get; }
        List<Log> GetAllLogs();
        bool NoAccess();
    }
}
