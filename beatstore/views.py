from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.models import User
from .models import Profile, Beat
from .forms import UserRegistrationForm, UserProfileForm, BeatUploadForm

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Créer un profil pour l'utilisateur
            Profile.objects.create(user=user)
            # Connecter l'utilisateur
            login(request, user)
            messages.success(request, 'Inscription réussie! Bienvenue sur Beatmaker Platform!')
            return redirect('profile')
    else:
        form = UserRegistrationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def profile_edit(request):
    if request.method == 'POST':
        user_form = UserProfileForm(request.POST, instance=request.user)
        profile = request.user.profile
        profile_form = ProfileForm(request.POST, request.FILES, instance=profile)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Votre profil a été mis à jour avec succès!')
            return redirect('profile')
    else:
        user_form = UserProfileForm(instance=request.user)
        profile_form = ProfileForm(instance=request.user.profile)
    
    return render(request, 'beatstore/profile_edit.html', {
        'user_form': user_form,
        'profile_form': profile_form
    })

@login_required
def beat_upload(request):
    if request.method == 'POST':
        form = BeatUploadForm(request.POST, request.FILES)
        if form.is_valid():
            beat = form.save(commit=False)
            beat.producer = request.user
            beat.save()
            # Gérer les tags
            form.save_m2m()  # Nécessaire pour les relations ManyToMany
            messages.success(request, 'Votre beat a été uploadé avec succès!')
            return redirect('beat_detail', beat_id=beat.id)
    else:
        form = BeatUploadForm()
    
    return render(request, 'beatstore/beat_upload.html', {'form': form})

@login_required
def profile(request):
    user = request.user
    beats = Beat.objects.filter(producer=user).order_by('-created_at')
    return render(request, 'beatstore/profile.html', {
        'user': user,
        'beats': beats
    })

def beat_detail(request, beat_id):
    beat = get_object_or_404(Beat, id=beat_id)
    related_beats = Beat.objects.filter(genre=beat.genre).exclude(id=beat.id)[:4]
    return render(request, 'beatstore/beat_detail.html', {
        'beat': beat,
        'related_beats': related_beats
    })

def home(request):
    latest_beats = Beat.objects.all().order_by('-created_at')[:8]
    popular_beats = Beat.objects.all().order_by('-plays')[:8]
    featured_beats = Beat.objects.filter(is_featured=True)[:4]
    
    return render(request, 'beatstore/home.html', {
        'latest_beats': latest_beats,
        'popular_beats': popular_beats,
        'featured_beats': featured_beats
    })
