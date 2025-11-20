# DJ Sports - User Guide

A complete guide for using the DJ Sports application.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Setting Up Playlists](#setting-up-playlists)
3. [Setting Playlist Types](#setting-playlist-types)
4. [Setting Track Start Times](#setting-track-start-times)
5. [Using the Match Page](#using-the-match-page)
6. [Settings and Features](#settings-and-features)

---

## Getting Started

### First Time Login
1. Open the DJ Sports application
2. Click **"Log in with Spotify"**
3. Authorize access to your Spotify account
4. You'll be automatically redirected to the Playlists page

### Basic Navigation
- **Playlists**: Main page for managing playlists, types, and start times
- **Match**: Live DJ view for match situations with carousels per type
- **Settings**: Centralized page for all app settings
- **Theme Switcher** (☀️/🌙/⚡): Switch between Light, Dark, and SPORTS themes
- **djCloud** (☁️): Synchronize data between devices
- **Log**: Show performance statistics (only visible on Match page)

---

## Setting Up Playlists

### Fetching Playlists from Spotify
When you log in, all your Spotify playlists are automatically fetched. You can see them in the left column on the Playlists page.

### Searching Playlists
1. Click the search icon (🔍) at the top of the playlist list
2. Enter search terms
3. Press **X** to clear the search

### Navigating Between Playlists
- **Click** on a playlist to view its tracks
- **Arrow keys up/down**: Switch between playlists (when search is not active)
- **Tab**: Move focus between playlist and track list

---

## Setting Playlist Types

Playlist types organize your music for different situations during the match.

### Available Types
- **🔥 Hotspot**: High-energy music for intense moments
- **⚽ Match**: Main music during the match
- **🎉 Fun Stuff**: Fun and engaging music
- **🏟️ Pre Match**: Warm-up music before the match
- **None**: Standard playlists without a specific type

### How to Set Type
1. Go to the **Playlists** page
2. Select a playlist in the left column
3. Find **Playlist Type** in the right column
4. Select type from the dropdown menu
5. The type is automatically saved in the browser

### Where Are Types Displayed?
- On the **Match page**, playlists are grouped by type
- Each type has its own color and section
- Types can be hidden/shown with accordions

---

## Setting Track Start Times

Start times let you jump directly to a specific point in a track - perfect for avoiding long intro sequences.

### How to Set Start Time
1. Go to the **Playlists** page
2. Select a playlist
3. In the track list, click the **time icon** (🕐) next to the track you want to edit
4. A slider appears below the track
5. Drag the slider to the desired start position
6. The start time is automatically saved
7. Click the **time icon** again to close the slider

### How to Remove Start Time
1. Open the start time slider for the track
2. Drag the slider all the way to the left (0:00)
3. The start time is automatically removed

### Display of Start Times
- **Playlists page**: Start time shown next to track duration (e.g., "→ 1:23")
- **Match page**: Start time shown as chip on album image
  - **Bright chip** with border = start time is set (> 0)
  - **Transparent chip** = start time is 0:00

### What Happens When You Play a Track?
When you click play on a track with start time:
- Spotify starts the track from the specified time
- You skip the intro and go straight to the action
- The track plays normally from that starting point

---

## Using the Match Page

The Match page is designed for live DJ situations with quick access to all playlists.

### Layout
- **Accordions**: Each playlist type has its own section
  - 🔥 HOT (red line)
  - ⚽ MATCH (blue line)
  - 🎉 FUN (green line)
  - 🏟️ PRE (yellow line)
- **Carousels**: Each playlist is displayed as a compact carousel

### Playlist Carousel
Each carousel shows:
- **Playlist name** and **track counter** (e.g., "1/12")
- **Album image** of current track
- **Previous/Next buttons** on the sides
- **Play/Pause button** on the album image
- **Start time chip** at the bottom of the image
- **Track name** and **artist** below the image

### Navigating the Carousel
- **Previous button** (◀): Go to previous track in the playlist
- **Next button** (▶): Go to next track in the playlist
- Buttons stretch the full height of the image for easy clicking

### Playing Tracks
1. Click the **Play button** (▶) on the album image
2. The track starts immediately on Spotify
3. If start time is set, the track starts from that time
4. The album image **animates** (pulses rapidly) when the track is playing
5. Play button changes to **Pause** (⏸)

### Auto-advance Feature
When a track starts playing:
- The carousel automatically advances to the next track after 1.5 seconds
- This prepares the next track for quick playback
- You can still navigate manually with the buttons

### Hide/Show Sections
- Click on the **type heading** (e.g., "🔥 HOT") to hide/show the section
- Multiple sections can be open simultaneously
- All sections are open by default

### Now Playing Bar (bottom)
- Shows **current track** playing on Spotify
- **Previous/Pause/Next** controls
- **Progress bar** with time display
- **Polling interval slider**: Control how often the app checks Spotify
- **Volume control**: Adjust Spotify volume

### Floating Pause Button
- A **floating pause button** appears when music is playing
- **Drag and drop**: Move the button to your desired position on screen
- **Click to pause**: Click the button to pause music
- **Position saved**: Button position is remembered between sessions
- **ESC key**: Press ESC to pause music (works even without the button)

---

## Settings and Features

### Settings Page
A centralized page for managing all app settings.

**How to open:**
- Click **"Settings"** in the navigation
- Or go directly to `/settings`

**Available settings:**

1. **Appearance**
   - Choose between Light, Dark, and SPORTS themes
   - Changes are saved automatically

2. **Spotify Device**
   - Select which device should be used for playback
   - Shows all available Spotify devices
   - 🟢 indicates active device
   - ⚠️ indicates restricted device
   - Automatic selection of Mac device if available
   - Device selection is cached for faster startup

3. **Update Frequency**
   - Adjust polling interval for playback status
   - Same functionality as on Now Playing Bar

4. **DJ Cloud Sync**
   - Complete synchronization of start times and types
   - See [djCloud section](#djcloud---cloud-synchronization) below for details

5. **Account**
   - Log out from your Spotify account
   - Ends current session

### djCloud - Cloud Synchronization
djCloud synchronizes playlist types and start times between your devices via the cloud.

**Access:**
- From the **Settings page** under "DJ Cloud Sync" section
- Or via the djCloud icon (☁️) in the navigation

**First Time Setup:**
1. Go to **Settings**
2. Find the **"DJ Cloud Sync"** section
3. Enter a **device name** (e.g., "MacBook Pro" or "iPad")
4. Click **Save Device Name**

**Backup (Upload to Cloud):**
1. Open the djCloud panel from Settings page
2. Check the status under "Sync Status":
   - **Orange up arrow (↑)**: You have local changes that should be backed up
3. Click the **Backup** button (highlighted if you have new changes)
4. Your types and start times are uploaded to the cloud

**Restore (Download from Cloud):**
1. Open the djCloud panel from Settings page
2. Check the status under "Sync Status":
   - **Blue down arrow (↓)**: The cloud has newer data than your device
3. Click the **Restore** button (highlighted if cloud has newer data)
4. Data from the cloud is downloaded and replaces your local data

**Sync Status Explanation:**
- **Green checkmark (✓)**: Everything is synchronized
- **Orange up arrow (↑)**: Upload your changes
- **Blue down arrow (↓)**: Download from cloud
- **Timestamp**: When the last backup/change occurred

**Best Practice:**
- **Backup** after making changes to start times or types
- **Restore** when switching to a new device
- Use unique device names to keep track

### Polling Interval
Controls how often the app checks Spotify for updates.

**Available Intervals:**
- **1s** - Very fast updates (uses more resources)
- **2s** - Fast
- **3s** - Standard (recommended)
- **5s** - Moderate
- **10s** - Slow
- **15s** - Very slow
- **Off** - No automatic updates

**Auto-polling:**
- Automatically starts at 5s when a track begins playing
- Automatically stops after 60 seconds without playback
- You can adjust manually at any time

**How to Adjust:**
- Find the slider on the **Now Playing Bar** (bottom)
- Drag the slider to desired interval
- Current interval shown on the right (e.g., "3s" or "Off")

### Themes
Switch between three visual styles:

- **☀️ Light**: Bright, professional theme
- **🌙 Dark**: Dark theme with purple accents (default)
- **⚡ SPORTS**: High-energy yellow/black theme (inspired by Sola Håndball)

Click the theme buttons in the navigation to switch. Your choice is saved automatically.

### Volume Control
- Find the volume slider on the **Now Playing Bar** (bottom)
- Drag the slider to adjust Spotify volume (0-100%)
- Percentage shown on the right

### Spotify Device Selection
Choose which device should be used for playback:

**From Settings page:**
1. Go to **Settings**
2. Find the **"Spotify Device"** section
3. Select device from dropdown menu
4. Click the refresh icon (🔄) to update the list
5. Selection is saved automatically

**Automatic selection:**
- App automatically selects Mac device if available
- Active devices are prioritized
- Device selection is cached for faster startup

**Device indicators:**
- **🟢**: Device is active and ready for playback
- **⚠️**: Device has restrictions
- **No indicator**: Device is available but not active

### Keyboard Navigation
On the Playlists page:
- **Arrow up/down**: Switch playlist (when search is not active)
- **Tab**: Move between playlist and track list
- **Enter**: Play selected track

**Global:**
- **ESC**: Pause music (works when music is playing)

### Token Expired
If you receive a message that "The access token expired":
1. Click **"Log in again"**
2. Authorize Spotify access again
3. You'll return to the same page

### Performance Log (developers)
Only visible on Match page:
- Click **Log** in the navigation
- View performance statistics for track startup
- Spotify API response times
- Cache hits and operation times

---

## Tips and Tricks

### For Fastest Track Startup
1. Set polling interval to **3s** or lower
2. Keep Spotify app open on a device
3. Use start times to avoid long intros
4. Prepare next track with auto-advance

### Organizing Playlists
1. Use **types** to categorize playlists
2. Name playlists clearly (e.g., "Match - High Energy 2024")
3. Backup regularly to djCloud
4. Test playlists before the match

### During the Match
1. Open the **Match page**
2. Keep all sections open for quick access
3. Use carousels to switch between tracks
4. Monitor Now Playing Bar to see what's playing
5. Adjust polling as needed

### Troubleshooting
- **Track won't start**: Check that Spotify is open and connected
- **Token expired**: Log in again
- **Changes disappear**: Backup to djCloud
- **Slow updates**: Reduce polling interval

---

## Support and Feedback

Found bugs or have suggestions for improvements?
Report issues at: https://github.com/dagnorland/djsportsweb

**Version**: See version number at bottom left in navigation (e.g., "v0.14.0")

---

*Made with ❤️ for DJs by DJs*
