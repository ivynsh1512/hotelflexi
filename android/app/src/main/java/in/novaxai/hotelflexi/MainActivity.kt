package `in`.novaxai.hotelflexi

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.core.content.ContextCompat
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import `in`.novaxai.hotelflexi.data.repository.HotelRepository
import `in`.novaxai.hotelflexi.ui.screens.*
import `in`.novaxai.hotelflexi.ui.theme.*

class MainActivity : ComponentActivity() {

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Permission handled
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val repository = HotelRepository(applicationContext)

        setContent {
            HotelFlexiTheme {
                HotelFlexiMainApp(
                    repository = repository,
                    initialIntent = intent
                )
            }
        }
    }
}

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Login : Screen("login", "Login", Icons.Default.Lock)
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Reservations : Screen("reservations", "Reservations", Icons.Default.CalendarToday)
    object Rooms : Screen("rooms", "Rooms", Icons.Default.MeetingRoom)
    object Calendar : Screen("calendar", "Calendar", Icons.Default.DateRange)
    object Billing : Screen("billing", "Billing", Icons.Default.Receipt)
    object Notifications : Screen("notifications", "Alerts", Icons.Default.Notifications)
    object Profile : Screen("profile", "Staff", Icons.Default.Person)
}

@Composable
fun HotelFlexiMainApp(
    repository: HotelRepository,
    initialIntent: Intent?
) {
    val navController = rememberNavController()
    val session = repository.session
    val startDestination = if (session.isLoggedIn()) Screen.Dashboard.route else Screen.Login.route

    // Handle deep-link extras from FCM push notifications
    LaunchedEffect(initialIntent) {
        val type = initialIntent?.getStringExtra("notification_type")
        if (type == "siren_alert" || type == "urgent" || type == "guest_complaint") {
            navController.navigate(Screen.Notifications.route)
        } else if (type == "reservation" || type == "booking") {
            navController.navigate(Screen.Reservations.route)
        }
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val bottomNavItems = listOf(
        Screen.Dashboard,
        Screen.Reservations,
        Screen.Rooms,
        Screen.Calendar,
        Screen.Billing,
        Screen.Profile
    )

    val showBottomBar = currentRoute != null && currentRoute != Screen.Login.route

    Scaffold(
        containerColor = BackgroundDark,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = SurfaceDark,
                    tonalElevation = NavigationBarDefaults.Elevation
                ) {
                    bottomNavItems.forEach { screen ->
                        val selected = currentRoute == screen.route
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    screen.icon,
                                    contentDescription = screen.title,
                                    tint = if (selected) BrandBlueLight else TextSecondary
                                )
                            },
                            label = {
                                Text(
                                    screen.title,
                                    color = if (selected) BrandBlueLight else TextSecondary,
                                    style = MaterialTheme.typography.labelSmall
                                )
                            },
                            selected = selected,
                            onClick = {
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = SurfaceCard
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    repository = repository,
                    onLoginSuccess = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    repository = repository,
                    onNavigateToReservations = { navController.navigate(Screen.Reservations.route) },
                    onNavigateToRooms = { navController.navigate(Screen.Rooms.route) },
                    onNavigateToBilling = { navController.navigate(Screen.Billing.route) },
                    onNavigateToAlerts = { navController.navigate(Screen.Notifications.route) }
                )
            }

            composable(Screen.Reservations.route) {
                ReservationsScreen(repository = repository)
            }

            composable(Screen.Rooms.route) {
                RoomsScreen(repository = repository)
            }

            composable(Screen.Calendar.route) {
                CalendarScreen(repository = repository)
            }

            composable(Screen.Billing.route) {
                BillingScreen(repository = repository)
            }

            composable(Screen.Notifications.route) {
                NotificationsScreen(
                    repository = repository,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    repository = repository,
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
