using Microsoft.AspNetCore.Mvc;

namespace HopewellClinicApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public ActionResult<object> GetHealth()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow, message = ".NET backend is running" });
        }
    }
}