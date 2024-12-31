from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'beatstore'

urlpatterns = [
    # Pages d'authentification
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='beatstore:home'), name='logout'),

    # Pages de profil
    path('profile/', views.profile, name='profile'),
    path('profile/edit/', views.profile_edit, name='profile_edit'),
    
    # Pages des beats
    path('', views.home, name='home'),  # Page d'accueil
    path('beat/upload/', views.beat_upload, name='beat_upload'),
    path('beat/<int:beat_id>/', views.beat_detail, name='beat_detail'),
    
    # Autres pages utiles
    path('password-reset/', 
         auth_views.PasswordResetView.as_view(template_name='registration/password_reset_form.html'),
         name='password_reset'),
    path('password-reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='registration/password_reset_done.html'),
         name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(template_name='registration/password_reset_confirm.html'),
         name='password_reset_confirm'),
    path('password-reset-complete/',
         auth_views.PasswordResetCompleteView.as_view(template_name='registration/password_reset_complete.html'),
         name='password_reset_complete'),
]
