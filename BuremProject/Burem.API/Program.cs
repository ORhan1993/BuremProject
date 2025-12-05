using Burem.API;
using Burem.API.Abstract;
using Burem.API.Concrete;
using Burem.Data.Models; 
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CORS Politikasýný Tanýmla (React'e izin ver)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // React genelde bu portta baþlar
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// --- SERVÝSLERÝN EKLENDÝÐÝ BÖLÜM ---

// 1. HttpContext Eriþimi Ýçin Gerekli (ESKÝ HttpContext.Current YERÝNE)
builder.Services.AddHttpContextAccessor();

// 2. Session Desteði (Eðer Session kullanmaya devam edecekseniz)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession();

builder.Services.AddControllers(options =>
{
    // Oluþturduðumuz filtreyi tüm projeye uyguluyoruz
    options.Filters.Add<Burem.API.Filters.LogActivityFilter>();
});

// Swagger / OpenAPI ayarlarý (API test ekraný için)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. ADIM: Veritabaný Baðlantý Cümlesini appsettings.json'dan okuyoruz
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. ADIM: SQL Server Baðlantýsýný Servislere Ekliyoruz
// Scaffolding ile oluþan Context ismin 'BuremDbContext' olduðu varsayýldý.
builder.Services.AddDbContext<BuremDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddScoped<IStudentService, StudentConcrete>();
builder.Services.AddScoped<ISessionService, SessionConcrete>();
builder.Services.AddScoped<ISecurityService, SecurityConcrete>();
builder.Services.AddScoped<IAppointmentService, AppointmentConcrete>();
builder.Services.AddScoped<IFormService, FormConcrete>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<BuremDbContext>();
        // DataSeeder sýnýfýndaki metodu çaðýrýyoruz
        await DataSeeder.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabaný seed edilirken bir hata oluþtu.");
    }
}

// --- HTTP ÝSTEK HATTI (PIPELINE) ---

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseSession();

app.UseAuthorization();

app.MapControllers();

app.Run();