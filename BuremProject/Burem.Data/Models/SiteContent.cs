using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class SiteContent
{
    public int Id { get; set; }

    public string ContentKey { get; set; } = null!;

    public string ContentValue { get; set; } = null!;

    public string? Description { get; set; }
}
