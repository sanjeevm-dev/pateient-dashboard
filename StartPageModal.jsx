import React, { useEffect, useRef, useState } from "react";
import { Client, Account } from "appwrite";
import {
  MicIcon,
  MicOff,
  Video,
  VideoIcon,
  VideoOff,
  Volume2,
} from "lucide-react";
import logo from "../assets/Exthalpy.svg";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("676816dc000fecbc4db4");

const account = new Account(client);

const StartPageModal = ({ isOpen, cameraOn, setCameraOn, micOn, setMicOn }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState(null);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      await account.createOAuth2Session("google", "/", "/page-not-found");
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        const audioOutputDevices = devices.filter(
          (device) => device.kind === "audiooutput"
        );
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCameraDevices(videoDevices);
        setAudioDevices(audioInputDevices);
        setAudioOutputDevices(audioOutputDevices);

        if (audioInputDevices.length > 0) {
          setSelectedMic(audioInputDevices[0].deviceId);
        }
        if (audioOutputDevices.length > 0) {
          setSelectedSpeaker(audioOutputDevices[0].deviceId);
        }
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError("Error fetching media devices.");
      }
    };

    getDevices();
  }, []);

  const toggleMic = async () => {
    try {
      if (!micOn) {
        if (navigator.mediaDevices) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            const audioTrack = micStream.getAudioTracks()[0];
            const updatedMediaStream = mediaStream || new MediaStream();
            updatedMediaStream.addTrack(audioTrack);
            setMediaStream(new MediaStream(updatedMediaStream.getTracks()));
          } catch (err) {
            console.error("Error accessing audio devices:", err);
            setError("Error accessing microphone. Please check permissions.");
            return;
          }
        } else {
          setError("Media devices are not supported in this browser.");
          return;
        }
      } else {
        if (mediaStream) {
          const audioTracks = mediaStream.getAudioTracks();
          audioTracks.forEach((track) => track.stop());
          setMediaStream(
            new MediaStream(
              mediaStream.getTracks().filter((t) => t.kind !== "audio")
            )
          );
        }
      }
      setMicOn(!micOn);
    } catch (err) {
      console.error("Error toggling microphone:", err);
      setError("Please turn on the mic and try again.");
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    setLoading(true);

    if (cameraOn && video) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            video.srcObject = stream;
            video.play();
            setLoading(false);
          })
          .catch((error) => {
            console.log("An error occurred: " + error);
            setError("Unable to access the camera.");
            setLoading(false);
          });
      }
      setLoading(false);
    } else {
      if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
      }
      setLoading(false);
    }

    return () => {
      if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [cameraOn, videoRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-between w-screen h-screen z-50">
      <div className="flex flex-col justify-center items-center w-full h-full md:flex-row">
        <div className="relative bg-white w-full h-full rounded-none md:rounded-xl flex items-center justify-center">
          <div className="absolute top-0 w-full justify-start m-8 pl-8 hidden md:flex">
            <img src={logo} alt="Login" className="w-48 h-12" />
          </div>

          <div className="bg-white border-2 border-slate-200 flex flex-col justify-center items-center rounded-2xl md:p-4 lg:p-6 w-1/2 h-3/4 md:w-10/12 lg:w-3/5 md:h-auto mt-10">
            <div
              className={`relative w-full h-full md:aspect-[16/9] bg-black rounded-2xl overflow-hidden ${
                cameraOn ? "border-2 border-green-500" : " "
              }`}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500 text-slate-950 rounded-lg">
                  <p className="text-center text-xs md:text-sm text-white">
                    {error} <br />
                    <span className="font-semibold text-xs md:text-sm">
                      Turn Camera ON
                    </span>
                  </p>
                </div>
              )}
              {!cameraOn && (
                <div className="bg-slate-950 absolute inset-0 rounded-lg w-full h-full object-cover flex items-center justify-center">
                  <p className="text-white text-xs md:text-sm">Camera is Off</p>
                </div>
              )}

              <video
                className="absolute inset-0 rounded-lg w-full h-full object-cover shadow-2xl"
                ref={videoRef}
                autoPlay
                playsInline
                aria-label="Camera feed"
              ></video>

              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-4 flex flex-col space-y-4 w-full items-center rounded-b-lg">
                <div className="flex space-x-4">
                  <button onClick={toggleMic} className="">
                    {micOn ? (
                      <MicIcon className="py-2 h-9 w-9 text-white bg-red-500 rounded-full border border-slate-600 cursor-pointer transition-all hover:scale-110 duration-300" />
                    ) : (
                      <MicOff className="py-2 h-9 w-9 text-slate-400 bg-slate-950 hover:bg-slate-600 rounded-full border border-slate-600 cursor-pointer hover:text-white transition-all hover:scale-110 duration-300" />
                    )}
                  </button>
                  <button
                    onClick={() => setCameraOn((prev) => !prev)}
                    className=""
                  >
                    {cameraOn ? (
                      <Video className="py-2 h-9 w-9 text-white bg-red-500 rounded-full border border-slate-600 cursor-pointer transition-all hover:scale-110 duration-300" />
                    ) : (
                      <VideoOff className="py-2 h-9 w-9 text-slate-400 bg-slate-950 hover:bg-slate-600 rounded-full border border-slate-600 cursor-pointer hover:text-white transition-all hover:scale-110 duration-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 w-full p-2 hidden lg:flex">
              <div className="flex gap-4 w-full">
                <div className="flex items-center space-x-2 flex-1">
                  <label htmlFor="mic-select" className="text-slate-950">
                    <MicIcon className="h-9 w-9 py-2 text-slate-700" />
                  </label>
                  <select
                    id="mic-select"
                    value={selectedMic || ""}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full p-2 rounded text-slate-950 text-sm"
                  >
                    {audioDevices.map((device) => (
                      <option
                        key={device.deviceId}
                        value={device.deviceId}
                        className="text-sm"
                      >
                        {device.label || `Microphone ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <label htmlFor="speaker-select" className="text-slate-950">
                    <Volume2 className="h-9 w-9 py-2 text-slate-700" />
                  </label>
                  <select
                    id="speaker-select"
                    value={selectedSpeaker || ""}
                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                    className="w-full p-2 rounded text-slate-950 text-sm"
                  >
                    {audioOutputDevices.map((device) => (
                      <option
                        key={device.deviceId}
                        value={device.deviceId}
                        className="text-sm"
                      >
                        {device.label || `Speaker ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <label htmlFor="camera-select" className="text-slate-950">
                    <VideoIcon className="h-9 w-9 py-2 text-slate-700" />
                  </label>
                  <select
                    id="camera-select"
                    value={selectedCamera || ""}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full p-2 rounded text-slate-950 text-sm"
                  >
                    {cameraDevices.map((device) => (
                      <option
                        key={device.deviceId}
                        value={device.deviceId}
                        className="text-sm"
                      >
                        {device.label || `Camera ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center gap-4 w-full p-6">
            <div className="flex flex-col space-x-0 text-center">
              <p className="text-lg sm:text-xl md:text-lg lg:text-3xl text-slate-950">
                Ready for a class?
              </p>
            </div>
            <div className="flex flex-col justify-center w-1/2">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-6 py-3 text-slate-950 bg-white rounded-full border hover:border-slate-950 hover:bg-slate-100 transition-all duration-300 w-full"
              >
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGx4EGtpNrJifRmDoNUvvzGdMMZUdsMHNJxA&s"
                  alt="Google Logo"
                  className="w-5 h-5"
                />
                <span className="font-semibold text-sm">Login with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPageModal;
