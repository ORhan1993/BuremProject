using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Enums;

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

    // --- TABLOLAR (DB SETS) ---
    public virtual DbSet<Answer> Answers { get; set; }
    public virtual DbSet<ErrorLog> ErrorLogs { get; set; }
    public virtual DbSet<ExcelView> ExcelViews { get; set; }
    public virtual DbSet<IpList> IpLists { get; set; }
    public virtual DbSet<Log> Logs { get; set; }
    public virtual DbSet<Option> Options { get; set; }
    public virtual DbSet<Question> Questions { get; set; }
    public virtual DbSet<QuestionGroup> QuestionGroups { get; set; }
    public virtual DbSet<QuestionType> QuestionTypes { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<SearchView> SearchViews { get; set; }
    public virtual DbSet<Session> Sessions { get; set; }
    public virtual DbSet<SiteContent> SiteContents { get; set; }
    public virtual DbSet<Student> Students { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Appointment> Appointments { get; set; }
    public virtual DbSet<GroupStudy> GroupStudies { get; set; }

    // --- YENİ EKLENEN/GÜNCELLENEN TABLOLAR ---
    public virtual DbSet<TherapistSchedule> TherapistSchedules { get; set; }
    public virtual DbSet<Therapist> Therapists { get; set; }
    public virtual DbSet<TherapistType> TherapistTypes { get; set; }
    public virtual DbSet<Campus> Campuses { get; set; }

    public virtual DbSet<UniversityCustomHoliday> UniversityCustomHolidays { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // Geliştirme ortamı için connection string (Canlıda appsettings.json kullanın)
            optionsBuilder.UseSqlServer("Server=193.140.192.77;Database=buremkayit;user id=buremkayit;password=uWPLeo4sL4;MultipleActiveResultSets=True;TrustServerCertificate=True;");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // --- 1. THERAPIST (UZMANLAR) - GÜNCELLENDİ ---
        modelBuilder.Entity<Therapist>(entity =>
        {
            entity.ToTable("Therapists");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.FirstName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.RoleId).HasDefaultValue(4);

            // SQL'deki DEFAULT değerlerin karşılıkları:
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.TherapistTypeId).HasDefaultValue(2); // Varsayılan: Deneyimli Uzman
            entity.Property(e => e.CampusId).HasDefaultValue(1);        // Varsayılan: Kuzey Kampüs

            // İlişkiler
            entity.HasOne(d => d.TherapistType)
                  .WithMany(p => p.Therapists)
                  .HasForeignKey(d => d.TherapistTypeId)
                  .OnDelete(DeleteBehavior.Restrict); // Tür silinirse uzmanlar boşa düşmesin diye koruma

            entity.HasOne(d => d.Campus)
                  .WithMany(p => p.Therapists)
                  .HasForeignKey(d => d.CampusId)
                  .OnDelete(DeleteBehavior.Restrict); // Kampüs silinirse uzmanlar boşa düşmesin diye koruma
        });

        // --- 2. THERAPIST TYPES (UZMAN TÜRLERİ) - YENİ ---
        modelBuilder.Entity<TherapistType>(entity =>
        {
            entity.ToTable("TherapistTypes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });

        // --- 3. CAMPUSES (KAMPÜSLER) - YENİ ---
        modelBuilder.Entity<Campus>(entity =>
        {
            entity.ToTable("Campuses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
        });

        // --- 4. ANSWER (CEVAPLAR) ---
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

        // --- 5. APPOINTMENT (RANDEVULAR) ---
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("Appointments");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.AppointmentDate).HasColumnType("datetime2(7)");
            entity.Property(e => e.EndDate).HasColumnType("datetime2(7)");
            entity.Property(e => e.AppointmentType).HasMaxLength(50);
            entity.Property(e => e.LocationOrLink).HasMaxLength(500);
            entity.Property(e => e.CancellationReason).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            // Status Enum Mapping
            entity.Property(e => e.Status)
                  .HasConversion<int>()
                  .HasDefaultValue(AppointmentStatus.Planned);

            // İlişkiler
            entity.HasOne(d => d.Session)
                  .WithMany()
                  .HasForeignKey(d => d.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.User)
                  .WithMany(p => p.StudentAppointments)
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Therapist)
                  .WithMany(p => p.Appointments)
                  .HasForeignKey(d => d.TherapistId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // --- 6. ERROR LOG ---
        modelBuilder.Entity<ErrorLog>(entity =>
        {
            entity.HasKey(e => e.ErrorId);
            entity.Property(e => e.ErrorId).HasColumnName("ErrorID");
        });

        // --- 7. EXCEL VIEW ---
        modelBuilder.Entity<ExcelView>(entity =>
        {
            entity.HasNoKey().ToView("ExcelView");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");
            entity.Property(e => e.Gpa).HasColumnName("GPA");
            entity.Property(e => e.IsDadAlive).HasColumnName("isDadAlive");
            entity.Property(e => e.IsMotherAlive).HasColumnName("isMotherAlive");
            entity.Property(e => e.IsScholar).HasColumnName("isScholar");
            entity.Property(e => e.IsWorking).HasColumnName("isWorking");
            entity.Property(e => e.IsImported).HasColumnName("isImported");
            entity.Property(e => e.BasvuruTuru).HasMaxLength(19).IsUnicode(false);
            entity.Property(e => e.QuestionTitle).HasMaxLength(513);
            entity.Property(e => e.OptionValue).HasMaxLength(4000);
        });

        // --- 8. IP LIST ---
        modelBuilder.Entity<IpList>(entity =>
        {
            entity.ToTable("IpList");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Ip).HasMaxLength(50).HasColumnName("IP");
        });

        // --- 9. LOG ---
        modelBuilder.Entity<Log>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.LogDate).HasColumnType("datetime");
            entity.Property(e => e.LogUser).HasMaxLength(250);
        });

        // --- 10. OPTION ---
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

        // --- 11. QUESTION ---
        modelBuilder.Entity<Question>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CanStudentAnswer).HasColumnName("canStudentAnswer");
            entity.Property(e => e.DisplayOrderNo).HasDefaultValue((byte)1);
            entity.Property(e => e.IsActive).HasColumnName("isActive");
            entity.Property(e => e.IsProfileQuestion).HasColumnName("isProfileQuestion");
            entity.Property(e => e.QuestionTitle).HasMaxLength(255);
        });

        // --- 12. QUESTION GROUP ---
        modelBuilder.Entity<QuestionGroup>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.GroupName).HasMaxLength(250).IsUnicode(false);
        });

        // --- 13. QUESTION TYPE ---
        modelBuilder.Entity<QuestionType>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.QuestionType1).HasMaxLength(255).HasColumnName("QuestionType");
        });

        // --- 14. ROLE ---
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.RoleName).HasMaxLength(50).IsRequired();

            entity.HasData(
                new Role { Id = 1, RoleName = "Admin" },
                new Role { Id = 2, RoleName = "Sekreter" },
                new Role { Id = 3, RoleName = "Öğrenci" },
                new Role { Id = 4, RoleName = "Terapist" }
            );
        });

        // --- 15. SEARCH VIEW ---
        modelBuilder.Entity<SearchView>(entity =>
        {
            entity.HasNoKey().ToView("SearchView");
            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.SessionDate).HasColumnType("datetime");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
        });

        // --- 16. SESSION ---
        modelBuilder.Entity<Session>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
            entity.Property(e => e.IsArchived).HasColumnName("isArchived");
            entity.Property(e => e.IsOnline).HasDefaultValue(false).HasColumnName("isOnline");
            entity.Property(e => e.SessionDate).HasColumnType("datetime");

            entity.Property(e => e.SessionNumber).HasDefaultValue(1);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.RiskLevel).HasMaxLength(50);
            entity.Property(e => e.ReferralDestination).HasMaxLength(255);
            entity.Property(e => e.TherapistNotes).HasColumnType("nvarchar(max)");

            entity.HasOne(d => d.Advisor)
                  .WithMany()
                  .HasForeignKey(d => d.AdvisorId)
                  .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Student)
                  .WithMany(p => p.Sessions)
                  .HasForeignKey(d => d.StudentId)
                  .OnDelete(DeleteBehavior.ClientSetNull)
                  .HasConstraintName("FK_Sessions_Students");
        });

        // --- 17. SITE CONTENT ---
        modelBuilder.Entity<SiteContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("SiteContent");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.ContentKey).HasMaxLength(255);
        });

        // --- 18. STUDENT ---
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

        // --- 19. USER ---
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.FirstName).HasMaxLength(150);
            entity.Property(e => e.LastName).HasMaxLength(150);
            entity.Property(e => e.UserName).HasMaxLength(255);

            entity.Property(e => e.TherapistCategory)
                  .HasMaxLength(50)
                  .HasConversion<string>();

            entity.HasOne(d => d.Role)
                  .WithMany()
                  .HasForeignKey(d => d.UserType)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}