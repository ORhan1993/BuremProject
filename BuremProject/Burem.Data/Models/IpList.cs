using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class IpList
{
    public int Id { get; set; }

    public string Ip { get; set; } = null!;

    public byte? Status { get; set; }

    public bool IsDeleted { get; set; }

    public bool IsAllowed { get; set; }

    public DateTime CreatedDate { get; set; }
}
