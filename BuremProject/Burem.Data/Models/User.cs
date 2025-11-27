using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public enum UserRole
{
    Admin = 1,
    Terapist = 4,
    Sekreter = 2,
    Ogrenci = 3
}

public partial class User
{
    public int Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public int UserType { get; set; }

    public string UserName { get; set; } = null!;

    public int Status { get; set; }

    public int IsDeleted { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public UserRole Role
    {
        get => (UserRole)UserType;
        set => UserType = (int)value;
    }
}
