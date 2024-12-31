from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Profile, Beat

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'email')

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ('avatar', 'bio', 'website', 'instagram', 'twitter', 'soundcloud')
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4}),
            'website': forms.URLInput(attrs={'placeholder': 'https://'}),
            'instagram': forms.TextInput(attrs={'placeholder': '@username'}),
            'twitter': forms.TextInput(attrs={'placeholder': '@username'}),
            'soundcloud': forms.TextInput(attrs={'placeholder': 'username'})
        }

class BeatUploadForm(forms.ModelForm):
    class Meta:
        model = Beat
        fields = ('title', 'audio_file', 'cover_image', 'price', 'genre', 
                 'bpm', 'description', 'tags', 'free_download')
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'tags': forms.TextInput(attrs={'placeholder': 'Séparez les tags par des virgules'}),
            'price': forms.NumberInput(attrs={'min': 0, 'step': 0.01}),
            'bpm': forms.NumberInput(attrs={'min': 1})
        }

    def clean_audio_file(self):
        audio_file = self.cleaned_data.get('audio_file')
        if audio_file:
            if audio_file.size > 50 * 1024 * 1024:  # 50MB limit
                raise forms.ValidationError("Le fichier audio ne doit pas dépasser 50MB.")
        return audio_file

    def clean_cover_image(self):
        cover_image = self.cleaned_data.get('cover_image')
        if cover_image:
            if cover_image.size > 5 * 1024 * 1024:  # 5MB limit
                raise forms.ValidationError("L'image ne doit pas dépasser 5MB.")
        return cover_image
