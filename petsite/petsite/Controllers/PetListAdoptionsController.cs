using Microsoft.AspNetCore.Mvc;

namespace PetSite.Controllers
{
    public class PetListAdoptionsController : Controller
    {
        // GET
        public IActionResult Index()
        {
            return View();
        }
    }
}