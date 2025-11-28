using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    // Veritabanındaki "UserRoles" tablosunu temsil eder.
    [Table("UserRoles")]
    public class Role
    {
        [Key]
        // ID'yi otomatik artan yapmıyoruz, Enum ile biz yönetiyoruz.
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string RoleName { get; set; }
    }
}