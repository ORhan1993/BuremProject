using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Burem.Data.Models;

public partial class BuremDbContext : DbContext
{
    public BuremDbContext()
    {
    }

    public BuremDbContext(DbContextOptions<BuremDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Answer> Answers { get; set; }
    public virtual DbSet<ErrorLog> ErrorLogs { get; set; }
    public virtual DbSet<ExcelView> ExcelViews { get; set; }
    public virtual DbSet<IpList> IpLists { get; set; }
    public virtual DbSet<Log> Logs { get; set; }
    public virtual DbSet<Option> Options { get; set; }
    public virtual DbSet<Question> Questions { get; set; }
    public virtual DbSet<QuestionGroup> QuestionGroups { get; set; }
    public virtual DbSet<QuestionType> QuestionTypes { get; set; }
    public virtual DbSet<Role> Roles { get; set; } // --- YENİ EKLENDİ ---
    public virtual DbSet<SearchView> SearchViews { get; set; }
    public virtual DbSet<Session> Sessions { get; set; }
    public virtual DbSet<SiteContent> SiteContents { get; set; }
    public virtual DbSet<Student> Students { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Appointment> Appointments { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code.
        => optionsBuilder.UseSqlServer("Server=193.140.192.77;Database=buremkayit;user id=buremkayit;password=uWPLeo4sL4;MultipleActiveResultSets=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // --- 1. ANSWER (CEVAPLAR) ---
        modelBuilder.Entity<Answer>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.OptionTitle).HasMaxLength(4000);
            entity.Property(e => e.OptionValue).HasMaxLength(4000);
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");
            entity.Property(e => e.QuestionTitle).HasMaxLength(255);
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");

            entity.HasOne(d => d.Session).WithMany(p => p.Answers)
                .HasForeignKey(d => d.SessionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Answers_Sessions");
        });

        // --- 2. APPOINTMENT (RANDEVULAR) - GÜNCELLENDİ ---
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Terapist İlişkisi
            entity.HasOne(d => d.Therapist)
                  .WithMany(p => p.TherapistAppointments)
                  .HasForeignKey(d => d.TherapistId)
                  .OnDelete(DeleteBehavior.Restrict); // Silme koruması

            // Öğrenci/Kullanıcı İlişkisi (YENİ)
            entity.HasOne(d => d.User)
                  .WithMany(p => p.StudentAppointments)
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Silme koruması
        });

        // --- 3. ERROR LOG ---
        modelBuilder.Entity<ErrorLog>(entity =>
        {
            entity.HasKey(e => e.ErrorId);
            entity.Property(e => e.ErrorId).HasColumnName("ErrorID");
        });

        // --- 4. EXCEL VIEW ---
        modelBuilder.Entity<ExcelView>(entity =>
        {
            // View olduğu için Key (PK) yoktur
            entity.HasNoKey().ToView("ExcelView");

            // ID Kolonları
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");

            // Öğrenci Bilgileri (Küçük harf başlayan kolon isimleri için map)
            entity.Property(e => e.Gpa).HasColumnName("GPA");
            entity.Property(e => e.IsDadAlive).HasColumnName("isDadAlive");
            entity.Property(e => e.IsMotherAlive).HasColumnName("isMotherAlive");
            entity.Property(e => e.IsScholar).HasColumnName("isScholar");
            entity.Property(e => e.IsWorking).HasColumnName("isWorking");
            entity.Property(e => e.IsImported).HasColumnName("isImported");

            // Metin Alanları
            entity.Property(e => e.BasvuruTuru)
                .HasMaxLength(19)
                .IsUnicode(false); // VARCHAR(19)

            entity.Property(e => e.QuestionTitle)
                .HasMaxLength(513); // Genelde birleştirilmiş metin olduğu için uzunluk farklı olabilir

            entity.Property(e => e.OptionValue)
                .HasMaxLength(4000); // Cevap alanı uzun olabilir
        });

        // --- 5. IP LIST ---
        modelBuilder.Entity<IpList>(entity =>
        {
            entity.ToTable("IpList");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Ip).HasMaxLength(50).HasColumnName("IP");
        });

        // --- 6. LOG ---
        modelBuilder.Entity<Log>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.LogDate).HasColumnType("datetime");
            entity.Property(e => e.LogUser).HasMaxLength(250);
        });

        // --- 7. OPTION ---
        modelBuilder.Entity<Option>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.OptionTitle).HasMaxLength(255);
            entity.Property(e => e.OptionValue).HasMaxLength(255).HasDefaultValueSql("((0))");
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");

            entity.HasOne(d => d.Question).WithMany(p => p.Options)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Options_Questions");
        });

        // --- 8. QUESTION ---
        modelBuilder.Entity<Question>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CanStudentAnswer).HasColumnName("canStudentAnswer");
            entity.Property(e => e.DisplayOrderNo).HasDefaultValue((byte)1);
            entity.Property(e => e.IsActive).HasColumnName("isActive");
            entity.Property(e => e.IsProfileQuestion).HasColumnName("isProfileQuestion");
            entity.Property(e => e.QuestionTitle).HasMaxLength(255);
        });

        // --- 9. QUESTION GROUP ---
        modelBuilder.Entity<QuestionGroup>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.GroupName).HasMaxLength(250).IsUnicode(false);
        });

        // --- 10. QUESTION TYPE ---
        modelBuilder.Entity<QuestionType>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.QuestionType1).HasMaxLength(255).HasColumnName("QuestionType");
        });

        // --- 11. ROLE (YENİ EKLENDİ) ---
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever(); // ID'yi biz Enum'dan veriyoruz
            entity.Property(e => e.RoleName).HasMaxLength(50).IsRequired();

            // Seed Data: Veritabanı oluşurken rolleri otomatik ekle
            entity.HasData(
                new Role { Id = 1, RoleName = "Admin" },
                new Role { Id = 2, RoleName = "Sekreter" },
                new Role { Id = 3, RoleName = "Öğrenci" },
                new Role { Id = 4, RoleName = "Terapist" }
            );
        });

        // --- 12. SEARCH VIEW ---
        modelBuilder.Entity<SearchView>(entity =>
        {
            entity.HasNoKey().ToView("SearchView");
            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.SessionDate).HasColumnType("datetime");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
        });

        // --- 13. SESSION (BAŞVURULAR) - BİRLEŞTİRİLDİ ---
        modelBuilder.Entity<Session>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
            entity.Property(e => e.IsArchived).HasColumnName("isArchived");
            entity.Property(e => e.IsOnline).HasDefaultValue(false).HasColumnName("isOnline");
            entity.Property(e => e.SessionDate).HasColumnType("datetime");

            // Yeni Alanlar
            entity.Property(e => e.SessionNumber).HasDefaultValue(1);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.RiskLevel).HasMaxLength(50);
            entity.Property(e => e.ReferralDestination).HasMaxLength(255);

            // İlişkiler
            entity.HasOne(d => d.Advisor)
                  .WithMany() // Advisor'ın Sessions listesi yoksa WithMany() boş bırakılır
                  .HasForeignKey(d => d.AdvisorId)
                  .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Student)
                  .WithMany(p => p.Sessions)
                  .HasForeignKey(d => d.StudentId)
                  .OnDelete(DeleteBehavior.ClientSetNull)
                  .HasConstraintName("FK_Sessions_Students");
        });

        // --- 14. SITE CONTENT ---
        modelBuilder.Entity<SiteContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("SiteContent");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.ContentKey).HasMaxLength(255);
        });

        // --- 15. STUDENT ---
        modelBuilder.Entity<Student>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Gpa).HasColumnName("GPA");
            entity.Property(e => e.IsDadAlive).HasColumnName("isDadAlive");
            entity.Property(e => e.IsImported).HasColumnName("isImported");
            entity.Property(e => e.IsMotherAlive).HasColumnName("isMotherAlive");
            entity.Property(e => e.IsScholar).HasColumnName("isScholar");
            entity.Property(e => e.IsWorking).HasColumnName("isWorking");
        });

        // --- 16. USER (GÜNCELLENDİ) ---
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.FirstName).HasMaxLength(150);
            entity.Property(e => e.LastName).HasMaxLength(150);
            entity.Property(e => e.UserName).HasMaxLength(255);

            // UserType -> Role İlişkisi
            entity.HasOne(d => d.Role)
                  .WithMany()
                  .HasForeignKey(d => d.UserType)
                  .OnDelete(DeleteBehavior.Restrict); // Rol silinirse User silinmesin
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}