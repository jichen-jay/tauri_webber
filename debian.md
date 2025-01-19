Getting ROCm installed on Debian 12 : r/debian [Skip to main content](#main-content) Getting ROCm installed on Debian 12 : r/debian

Open menu[](/)

Expand search [Create post](/r/debian/submit)

[Open inbox](/notifications)

![User Avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_5.png)

Expand user menu

[

![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)

Go to debian](/r/debian/)

[r/debian](/r/debian/) 

[FoxFyer](/user/FoxFyer/)

ADMIN MOD

# Getting ROCm installed on Debian 12

I'm experimenting with Debian 12 (stable) after using Kubuntu for a while, and it works perfectly for me in every way but one, and it's the most important one unfortunately. The only thing keeping me from switching to it is that I can't find a way to install ROCm so that I can do GPU rendering in Blender with my AMD card.

ROCm only officially supports Ubuntu (and only up to 22.04, which is about to go EoL) and not Debian explicitly; but I'm going off the premise that Ubuntu is just Debian with some pepper on it, so anything that works in the former really should work in the latter with just maybe a couple of extra steps involved. This seems to be supported by older comments I've found from people saying that they've been able to get ROCm working in Debian previously.

Anyway, I follow the instructions [given here](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/how-to/native-install/ubuntu.html) for installing ROCm via the package manager. Amdgpu-dkms seems to install without any complaints, although the system for some reason can't find the command "dkms status". But ROCm itself won't install at all; after `sudo apt install rocm` it says

The following packages have unmet dependencies:
 rocm-gdb : Depends: libpython3.10 but it is not installable or
                     libpython3.8 but it is not installable
E: Unable to correct problems, you have held broken packages.

And this is the one hurdle I just can't get past. Debian 12 has Python 3.11.2, but Pythons 3.10 and 3.8 or their libraries are not available in any repositories. I've gone as far as just downloading them separately from Python's website and installing them (as non-default, but definitely there as confirmed by --version checks) but even when I do that apt can't see them when I try to install ROCm.

GPU rendering in Blender is a hard requirement; if I can't do it, I can't switch to Debian, and I really want to switch to Debian. Does anyone have any suggestions?

Edit: Problem solved using [u/gee-one](/user/gee-one/) 's solution, which you can read at his github here: [https://gitlab.com/gee-one/debian-12-rocm](https://gitlab.com/gee-one/debian-12-rocm)

Join the conversation Join the conversation Cancel Comment

Sort by:

Best

-   Best
    -   Top
    -   New
    -   Controversial
    -   Old
    -   Q&A
    

[![u/Andrelliina avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/Andrelliina/)

[Andrelliina](/user/Andrelliina/)

• [](/r/debian/comments/1dcuqma/comment/l810dy9/)

Did you make dpkgs and install them when you downloaded from the python site?

I see they might be available from ubuntu - have you tried installing the ubuntu libpythons

Reply reply

[![u/ScratchHistorical507 avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png)](/user/ScratchHistorical507/)

[ScratchHistorical507](/user/ScratchHistorical507/)

• [](/r/debian/comments/1dcuqma/comment/l836jnp/)

Take a look at this, maybe it helps: [https://apt.rocm.debian.net/](https://apt.rocm.debian.net/)

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/l87d5vu/)

Now that is interesting. It's encouraging to know that someone somewhere on the ROCm team is "working on" a possible Debian version, although it looks like there's a low possibility of it being officially released. But it sounds like ROCm's main priority is getting it working well with PyTorch for AI purposes, whereas all I really need from it is HIP so that Blender can do GPU rendering, so I'll likely have to wait a while.

It's a bit unfortunate; until they do some kind of new release not only won't I be able to switch to Debian 12, I won't even be able to upgrade to the new Kubuntu LTS because the current release is only compatible with the last one.

Reply reply

[![u/ScratchHistorical507 avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png)](/user/ScratchHistorical507/)

[ScratchHistorical507](/user/ScratchHistorical507/)

• [](/r/debian/comments/1dcuqma/comment/l893jcr/)

ROCm (and the equally misguided efforts around AMF) is mostly meant to be installed alongside their closed source AMDGPU Pro drivers. That's why pretty much no distro is officially is supported. And no, nobody on the ROCm team is working on any Debian support, that's a Debian team working on getting ROCm somehow supported on Debian. But it must be going bad enough that they don't include it to the main Debian repo.

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/l8a6w62/)

I don't know that I'd call it misguided, necessarily. On xbuntu 22.04 ROCm works after all, at least the way I use it. But it is obviously not like a high priority for AMD and that's a real shame.

Reply reply

[1 more reply](/r/debian/comments/1dcuqma/comment/l8a6w62/) [More replies](/r/debian/comments/1dcuqma/comment/l8a6w62/) [More replies](/r/debian/comments/1dcuqma/comment/l893jcr/) [More replies](/r/debian/comments/1dcuqma/comment/l87d5vu/) [More replies](/r/debian/comments/1dcuqma/comment/l836jnp/)

[![u/gee-one avatar](https://styles.redditmedia.com/t5_b3i5z/styles/profileIcon_fb4jn24zgsf71.png?width=64&height=64&frame=1&auto=webp&crop=64:64,smart&s=ea558bd0a36ef91913aeacad27c4b73802f7e8d3)](/user/gee-one/)

[gee-one](/user/gee-one/)

• [](/r/debian/comments/1dcuqma/comment/l87fe5d/)

I played with this a little bit with bullseye. There were a few tricks to get enough of it to install...

There were some unmet dependencies that were trivial enough that you could make a fake package that provides the unmet dependency.

I think there were some dkms modules that were only available for specific ubuntu kernels, so you would have to use the ubuntu kernels so that the dkms modules would be installable. This might be moot with a more recent kernel version.

This was all for several ROCM versions ago, so the kernels and dependencies might be very different. This was also not for the full ROCM install, just enough to get openCL and few other things running. I'm not a blender user, but I think it would render at least some of the benchmarks.

Reply reply

[![u/gee-one avatar](https://styles.redditmedia.com/t5_b3i5z/styles/profileIcon_fb4jn24zgsf71.png?width=64&height=64&frame=1&auto=webp&crop=64:64,smart&s=ea558bd0a36ef91913aeacad27c4b73802f7e8d3)](/user/gee-one/)

[gee-one](/user/gee-one/)

• [](/r/debian/comments/1dcuqma/comment/l8csil8/)

So... this got my a little curious to see if rocm was installable. short answer, I think it is but I keep getting out of memory errors when I try to run blender benchmarks. I might be doing it wrong. But rocminfo finds my GPU, CPU, and integrated graphics. It seems like I can render on the CPU, but the both GPU and integrated GPU run out of memory.

Here is an overview of what I did...

1.  build the 6.5 kernel from Ubuntu. You might be able to just download the packages from the ubuntu repos and apt install ./\*deb them, update-grub, and reboot. I used the kernel tooling to build it.
    
2.  I followed the package manager install directions... add gpg key, add repos, etc. Then apt install amdgpu-dkms. 'dkms status' showed the module installed.
    
3.  apt install rocm -sV shows the same libpython dependency, but there probably isn't too much difference between 3.10 and 3.11. I think there were several things that were marked as deprecated, but not actually removed. I used equivfs to build a fake package that depended on libpython3-stdlib (from debian) and provides libpython3.10. apt install ... and away!
    
4.  apt install rocm -V will install successfully.... unless you run out of drive space because the kernel source is over 30GB.
    
5.  blender benchmarks fail with out of memory errors. It does detect my GPU and iGPU.
    

BLENDER: Error: Out of memory in hipDrvMemcpy2DUnaligned(&param) (intern/cycles/device/hip/device\_impl.cpp:788)

Maybe there is some issue with using python 3.11? My GPU might not be fully supported?

Is there some other test, blender or otherwise, that I can try that might be easier on memory to see if the rocm installation works correctly?

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/l8cw9kz/) • Edited 

Interesting!

What I've done so far is install the dkms package and then installed the ROCm libraries directly from Synaptic. This is on Debian 12's default kernel. After doing this, Blender recognizes my GPU. Curiously only when launched directly from the unzipped archive though; Flatpak Blender still doesn't see it. Anyway, when I try to render or even just switch to render preview mode, I don't get any memory errors, instead I get

"Failed to load HIP kernel from '\[#directory\]/4.1/scripts/addons/cycles/lib/kernel\_gfx1031.fatbin' (Shared object initialization failed)"

...which is unhelpful to me. What shared object? This sounds to me like a missing dependency problem, maybe a non-rocm library I should've downloaded? But at any rate I don't have the skills to dig and see what exactly is missing.

I'll restore to a clean Debian and try it your way and see what I come up with. But I'm very newb and some of those things you did are things I'm going to have to learn how to do, like making fake packages and installing the newer kernel. I'll have to wait until the weekend when I have enough time to set aside for that.

ETA: The default cube/light/camera scene when you first open Blender is ready to render, so if you need a low-data scene to test on, you can just render that. It's not fancy but that's okay for initial tests.

Reply reply

[![u/gee-one avatar](https://styles.redditmedia.com/t5_b3i5z/styles/profileIcon_fb4jn24zgsf71.png?width=64&height=64&frame=1&auto=webp&crop=64:64,smart&s=ea558bd0a36ef91913aeacad27c4b73802f7e8d3)](/user/gee-one/)

[gee-one](/user/gee-one/)

• [](/r/debian/comments/1dcuqma/comment/l8qhv81/)

I added instructions here... [https://gitlab.com/gee-one/debian-12-rocm](https://gitlab.com/gee-one/debian-12-rocm)

good luck and let me know if there are any issues and/or send a pull request.

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/l8qjp95/)

MANY thanks. I'll give this a go this afternoon and let you know. Fingers crossed...

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/l8rqx6t/) • Edited 

All right I'm trying this, but I'm unable to even start building the kernel. Everything goes fine until

`nice make -j\`nproc\` bindeb-pkg\`

At which point I get

`make: *** No rule to make target 'bindeb-pkg'. Stop.`

Not really sure what that's about. I am running this all as root, btw. I'm looking around to see what could be causing the problem; any suggestions?

ETA: I'm running this on a clean install of Debian, plus Timeshift and that's it. Is there maybe something you have previously installed that is letting you avoid this error?

Reply reply

[9 more replies](/r/debian/comments/1dcuqma/comment/l8rqx6t/) [More replies](/r/debian/comments/1dcuqma/comment/l8rqx6t/) [More replies](/r/debian/comments/1dcuqma/comment/l8qhv81/) [More replies](/r/debian/comments/1dcuqma/comment/l8cw9kz/)

[![u/gee-one avatar](https://styles.redditmedia.com/t5_b3i5z/styles/profileIcon_fb4jn24zgsf71.png?width=64&height=64&frame=1&auto=webp&crop=64:64,smart&s=ea558bd0a36ef91913aeacad27c4b73802f7e8d3)](/user/gee-one/)

[gee-one](/user/gee-one/)

• [](/r/debian/comments/1dcuqma/comment/l8cx32f/)

[u/FoxFyer](/user/FoxFyer/) Hold the phone... I downloaded a different version of blender 4.0.0 and it worked. I was originally trying 3.6.0, thinking that an older version would be more compatible with my hardware. I did try installing python 3.10 to see if there was a compatibility issue.

non-root, python 3.10

`Benchmark complete:`

`monster: 1300.459315 samples per minute`

`junkshop: 695.825972 samples per minute`

`classroom: 640.737246 samples per minute`

root user, python 3.11

`Benchmark complete:`

`monster: 1322.820001 samples per minute`

`junkshop: 719.668788 samples per minute`

`classroom: 618.037075 samples per minute`

Are these results any good? Let me know if you need more details about the fake package.

also, try /usr/sbin/dkms status, or maybe try it as root. \*/sbin isn't on the default path for non-privileged users. You might have the dkms module loaded and just can't run the dkms executable to check it. Back in the bullseye days, I remember being able to install the module with a "close enough" kernel version, or perhaps I edited the dkms module so that it would install. Either way, install onto the ubuntu kernel is cleaner.

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/l8cxrif/)

Wow! This is HIGHLY encouraging. Again, I'll have to wait until the weekend so I can make a day of working on this, But if I can pull it off and it works stable and reliably until AMD finally gets something official out the door that'll be awesome.

I might have some more questions for you about this during the weekend if that's okay. Thanks for looking into this and giving it a shot!

Reply reply

[![u/gee-one avatar](https://styles.redditmedia.com/t5_b3i5z/styles/profileIcon_fb4jn24zgsf71.png?width=64&height=64&frame=1&auto=webp&crop=64:64,smart&s=ea558bd0a36ef91913aeacad27c4b73802f7e8d3)](/user/gee-one/)

[gee-one](/user/gee-one/)

• [](/r/debian/comments/1dcuqma/comment/l8cypfd/)

I'll try to write up some more detailed instructions.

Reply reply

[1 more reply](/r/debian/comments/1dcuqma/comment/l8cypfd/) [More replies](/r/debian/comments/1dcuqma/comment/l8cypfd/) [More replies](/r/debian/comments/1dcuqma/comment/l8cxrif/) [More replies](/r/debian/comments/1dcuqma/comment/l8cx32f/) [More replies](/r/debian/comments/1dcuqma/comment/l8csil8/)

[![u/shill_destroyer_69 avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png)](/user/shill_destroyer_69/)

[shill\_destroyer\_69](/user/shill_destroyer_69/)

• [](/r/debian/comments/1dcuqma/comment/lcdyrwh/)

I don't have a solution unfortunately but I'd like to nitpick something:

> Ubuntu (and only up to 22.04, which is about to go EoL)

22.04 is supported until late 2027, so I wouldn't say it's "about" to go EoL. Fedora releases are only supported for 1 year, so it could certainly be worse.

And I assume AMD is going to update its proprietary driver for 24.04 before 22.04 goes EoL, so you could just stick with 22.04 for now and then upgrade when AMD gets around to that.

Reply reply

[![u/FoxFyer avatar](https://www.redditstatic.com/avatars/defaults/v2/avatar_default_0.png)](/user/FoxFyer/)

[FoxFyer](/user/FoxFyer/)

• [](/r/debian/comments/1dcuqma/comment/lcgqqev/)

Oh interesting - thanks for clearing that up. There were other reasons beyond that that I wanted to hop on Debian, I guess that misunderstanding made switching a more urgent matter for me than it needed to be. Another poster here did help me solve my problem and make it happen though, so it's water under the bridge now I suppose.

Reply reply [More replies](/r/debian/comments/1dcuqma/comment/lcdyrwh/)

[](/user/Otherwise-Glove-8967/)

[Otherwise-Glove-8967](/user/Otherwise-Glove-8967/)

• [](/r/debian/comments/1dcuqma/comment/ljkag87/)

Thank you so much for including the solution, was super useful!

Reply reply

**Top 2%** [Rank by size](https://www.reddit.com/best/communities/21/#t5_2qhkk/)

Public

Anyone can view, post, and comment to this community

## 

Rules

-   1
    
    ## Post does not relate directly to Debian
    

Posts must relate to Debian (i.e. not just Linux in general).

# More posts you may like

-   [
    
    ![r/StableDiffusion icon](https://styles.redditmedia.com/t5_6r4pfl/styles/communityIcon_kihji9n3ydmd1.png)
    
    r/StableDiffusion
    
    ](/r/StableDiffusion)
    
    [
    
    ### AMD ROCm installation working on Linux is a fake marketing, do not fall into it.
    
    
    
    
    
    ](/r/StableDiffusion/comments/1be2g28/amd_rocm_installation_working_on_linux_is_a_fake/)
    
    41 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Can't install curl on a freshly-installed Debian 12
    
    
    
    
    
    ](/r/debian/comments/1cxadyk/cant_install_curl_on_a_freshlyinstalled_debian_12/)
    
    2 upvotes · 8 comments
    
    * * *
    
-   [
    
    r/linuxquestions
    
    ](/r/linuxquestions)
    
    [
    
    ### Error installing amd rocm
    
    
    
    
    
    ](/r/linuxquestions/comments/qu8n5d/error_installing_amd_rocm/)
    
    4 upvotes · 47 comments
    
    * * *
    
-   [
    
    ![r/Amd icon](https://styles.redditmedia.com/t5_2rw0n/styles/communityIcon_1a8fhjs0ql9c1.png)
    
    r/Amd
    
    ](/r/Amd)
    
    [
    
    ### A video guide for installing ROCm drivers and Stable Diffusion in Linux for AMD GPU (Automatic1111 and ComfyUI)
    
    
    
    
    
    ](/r/Amd/comments/17yvvkm/a_video_guide_for_installing_rocm_drivers_and/)
    
    62 upvotes · 22 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### HIP and ROCM in Debian 12
    
    
    
    
    
    ](/r/debian/comments/1e2ue85/hip_and_rocm_in_debian_12/)
    
    6 upvotes · 11 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Updated Debian 12: 12.9 released
    
    
    
    
    
    ](/r/debian/comments/1hywm76/updated_debian_12_129_released/)
    
    154 upvotes · 30 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### All roads lead to Debian
    
    
    
    
    
    ](/r/debian/comments/1hw1wm0/all_roads_lead_to_debian/)
    
    174 upvotes · 52 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Rocm-dev from FLOSS packages, or rocm-dkms from AMDGPU-Pro for machine learning on Radon VII with Linux 5.0.0 and Sid?
    
    
    
    
    
    ](/r/debian/comments/ayrrjh/rocmdev_from_floss_packages_or_rocmdkms_from/)
    
    3 upvotes · 2 comments
    
    * * *
    
-   [
    
    ![r/c64 icon](https://styles.redditmedia.com/t5_2qin7/styles/communityIcon_k2uoshhqguk61.jpg?format=pjpg&s=1bd7869f532f40952119b00e0ddaf5e856eb532c)
    
    r/c64
    
    ](/r/c64)
    
    [
    
    ### How to install vice on debian 12?
    
    
    
    
    
    ](/r/c64/comments/1cmzvcg/how_to_install_vice_on_debian_12/)
    
    4 upvotes · 13 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Microphone not working in Debian 12
    
    
    
    
    
    ](/r/debian/comments/1ce80vz/microphone_not_working_in_debian_12/)
    
    2 upvotes · 4 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Install debian on UTM
    
    
    
    
    
    ](/r/debian/comments/1d7jd4d/install_debian_on_utm/)
    
    * * *
    
-   [
    
    r/ROCm
    
    ](/r/ROCm)
    
    [
    
    ### If you having problems with installing ROCm with AMD GPU on Ubuntu
    
    
    
    
    
    ](/r/ROCm/comments/1ailrt0/if_you_having_problems_with_installing_rocm_with/)
    
    10 upvotes · 13 comments
    
    * * *
    
-   [
    
    r/ROCm
    
    ](/r/ROCm)
    
    [
    
    ### Ubuntu 24.04 amdgpu-dkms prevents default apps from running
    
    
    
    
    
    ](/r/ROCm/comments/1fbqkud/ubuntu_2404_amdgpudkms_prevents_default_apps_from/)
    
    3 upvotes · 12 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Debian 12 AMD Opencl
    
    
    
    
    
    ](/r/debian/comments/108cboq/debian_12_amd_opencl/)
    
    8 upvotes · 7 comments
    
    * * *
    
-   [
    
    ![r/Amd icon](https://styles.redditmedia.com/t5_2rw0n/styles/communityIcon_1a8fhjs0ql9c1.png)
    
    r/Amd
    
    ](/r/Amd)
    
    [
    
    ### Getting started with rocM
    
    
    
    
    
    ](/r/Amd/comments/163v15n/getting_started_with_rocm/)
    
    20 upvotes · 27 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Is anyone using ROCm on Debian 10 (or later)?
    
    
    
    
    
    ](/r/debian/comments/ffncdg/is_anyone_using_rocm_on_debian_10_or_later/)
    
    8 upvotes · 4 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Just switched to Debian from Ubuntu and the difference is night and day
    
    
    
    
    
    ](/r/debian/comments/1hqqe0g/just_switched_to_debian_from_ubuntu_and_the/)
    
    293 upvotes · 109 comments
    
    * * *
    
-   [
    
    r/ROCm
    
    ](/r/ROCm)
    
    [
    
    ### Problems with Mint 21
    
    
    
    
    
    ](/r/ROCm/comments/yqrm5s/problems_with_mint_21/)
    
    4 upvotes · 5 comments
    
    * * *
    
-   [
    
    r/ROCm
    
    ](/r/ROCm)
    
    [
    
    ### Trying to install rocm to run pytorch for my rx 6950xt.
    
    
    
    
    
    ](/r/ROCm/comments/1g9h3xb/trying_to_install_rocm_to_run_pytorch_for_my_rx/)
    
    3 upvotes · 13 comments
    
    * * *
    
-   [
    
    ![r/framework icon](https://styles.redditmedia.com/t5_2s5og/styles/communityIcon_o9bjy1w5cypa1.png)
    
    r/framework
    
    ](/r/framework)
    
    [
    
    ### Installing Debian Trixie on Framework 16
    
    
    
    
    
    ](/r/framework/comments/1cbzroo/installing_debian_trixie_on_framework_16/)
    
    4 upvotes · 3 comments
    
    * * *
    
-   [
    
    r/ROCm
    
    ](/r/ROCm)
    
    [
    
    ### Ubuntu 24.04: install rocm without amdgpu-dkms?
    
    
    
    
    
    ](/r/ROCm/comments/1chloqg/ubuntu_2404_install_rocm_without_amdgpudkms/)
    
    5 upvotes · 10 comments
    
    * * *
    
-   [
    
    r/linuxquestions
    
    ](/r/linuxquestions)
    
    [
    
    ### unresolvable libpython3.8 dependency for ROCm AMD driver on pop!OS 21:10
    
    
    
    
    
    ](/r/linuxquestions/comments/qdukzc/unresolvable_libpython38_dependency_for_rocm_amd/)
    
    6 upvotes · 8 comments
    
    * * *
    
-   [
    
    ![r/debian icon](https://styles.redditmedia.com/t5_2qhkk/styles/communityIcon_krd3oanc6k611.png)
    
    r/debian
    
    ](/r/debian)
    
    [
    
    ### Debian 12 user desperately trying to get ROCM with PyTorch to work (again).
    
    
    
    
    
    ](/r/debian/comments/189i98q/debian_12_user_desperately_trying_to_get_rocm/)
    
    9 upvotes · 16 comments
    
    * * *
    
-   [
    
    r/ROCm
    
    ](/r/ROCm)
    
    [
    
    ### Fedora 41 + ROCm (dkms) compatibility
    
    
    
    
    
    ](/r/ROCm/comments/1ghii8c/fedora_41_rocm_dkms_compatibility/)
    
    1 upvote · 8 comments
    
    * * *
    
-   [
    
    ![r/Ubuntu icon](https://styles.redditmedia.com/t5_2qh62/styles/communityIcon_y7anc8ltwpu81.jpg?format=pjpg&s=4ff042faaaa63c40d33a44bf25c72d500e57f8ff)
    
    r/Ubuntu
    
    ](/r/Ubuntu)
    
    [
    
    ### amd Rocm installation problem
    
    
    
    
    
    ](/r/Ubuntu/comments/1bdmmha/amd_rocm_installation_problem/)
    
    2 upvotes · 1 comment
    
    * * *