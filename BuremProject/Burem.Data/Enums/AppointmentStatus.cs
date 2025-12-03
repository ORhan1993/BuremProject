using System;
using System.Collections.Generic;
using System.Text;

namespace Burem.Data.Enums
{
    public enum AppointmentStatus
    {
        Planned = 0,     // Planlandı
        Completed = 1,   // Tamamlandı (Geldi)
        NoShow = 2,      // Gelmedi
        Cancelled = 3    // İptal Edildi
    }
}
