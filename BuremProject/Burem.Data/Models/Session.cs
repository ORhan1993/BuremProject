using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models;

public partial class Session
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public DateTime SessionDate { get; set; }

    public int AdvisorId { get; set; }

    [ForeignKey("AdvisorId")]
    public virtual User? Advisor { get; set; }

    // --- YENİ EKLENEN ALANLAR (ANALİZE GÖRE) ---
    
    // Kaçıncı seans olduğu (1'den 8'e kadar)
    public int SessionNumber { get; set; } = 1;

    // Seans durumu: "Planlandı", "Tamamlandı", "İptal", "Gelmedi"
    public string? Status { get; set; }

    // Sadece terapistin göreceği gizli notlar
    public string? TherapistNotes { get; set; }

    // Analizdeki risk seviyesi (Düşük, Orta, Yüksek)
    public string? RiskLevel { get; set; }

    // Yönlendirme bilgisi (BÜPAM, Hastane vb.) veya Sonlandırma nedeni
    public string? ReferralDestination { get; set; }

    // -------------------------------------------
    

    public int? DanismanO { get; set; }

    public int? DanismanG { get; set; }

    public int? DanismanB { get; set; }

    public bool? IsArchived { get; set; }

    public bool? IsOnline { get; set; }

    public bool? Disclaimer { get; set; }

    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public virtual Student Student { get; set; } = null!;


}
