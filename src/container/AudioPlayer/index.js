import React, { Component } from 'react';
import { Image, Text, View, Dimensions, Platform } from 'react-native';
import * as Actions from '../../actions/index';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Video from 'react-native-video';
import Styles from '../../styles';
import * as Utils from '../../utils/audio'; //eslint-disable-line
import {
  ForwardButton,
  BackwardButton,
  PlayButton,
  ShuffleButton,
  VolumeButton,
  DownloadButton, //eslint-disable-line
  SongSlider
} from '../../components/PlayerButtons';
import MusicControl from 'react-native-music-control';
import * as Progress from 'react-native-progress'; //eslint-disable-line
const { width } = Dimensions.get('window');
import { autobind } from 'core-decorators';

@autobind class AudioPlayer extends Component {
  constructor(props) {
    super(props);

    const songs = this.props.navigation.state.params.chapters.chapters;

    this.state = {
      playing: true,
      muted: false,
      shuffle: false,
      sliding: false,
      currentTime: 0,
      songIndex: this.props.navigation.state.params.chapters.selected_chapter -
        1,
      songs
    };
  }

  songImage = '';

  componentDidMount() {
    MusicControl.enableControl('play', true);
    MusicControl.enableControl('pause', true);
    MusicControl.enableControl('nextTrack', true);
    MusicControl.enableControl('previousTrack', true);
    MusicControl.enableControl('seekForward', false);
    MusicControl.enableControl('seekBackward', false);
    MusicControl.enableBackgroundMode(true);
    MusicControl.on('play', () => {
      this.setState({ playing: true });
    });
    MusicControl.on('pause', () => {
      this.setState({ playing: false });
    });
    MusicControl.on('nextTrack', this.goForward);
    MusicControl.on('previousTrack', this.goBackward);
  }

  // eslint-disable-next-line
  onLoad(params) {
    this.setState({ songDuration: params.duration });
    this.setPlayingSong();
  }

  setPlayingSong() {
    const song = this.state.songs[this.state.songIndex];
    MusicControl.setNowPlaying({
      title: song.title,
      artwork: song.thumb,
      artist: song.artist,
      duration: song.songDuration
    });
  }

  setTime(params) {
    if (!this.state.sliding) {
      this.setState({ currentTime: params.currentTime });
    }
  }

  randomSongIndex() {
    const maxIndex = this.state.songs.length - 1;
    return Math.floor(Math.random() * (maxIndex - 0 + 1)) + 0; //eslint-disable-line
  }

  toggleShuffle() {
    this.setState({ shuffle: !this.state.shuffle });
  }

  toggleVolume() {
    this.setState({ muted: !this.state.muted });
  }

  togglePlay() {
    this.setState({ playing: !this.state.playing });
  }

  onSlidingStart() {
    this.setState({ sliding: true });
  }

  onSlidingChange(value) {
    const newPosition = value * this.state.songDuration;
    this.setState({ currentTime: newPosition });
  }

  onSlidingComplete() {
    this.refs.audio.seek(this.state.currentTime); //eslint-disable-line
    this.setState({ sliding: false });
  }

  goForward() {
    if (
      this.state.shuffle ||
      this.state.songIndex + 1 !== this.state.songs.length
    ) {
      this.setState({
        songIndex: this.state.shuffle
          ? this.randomSongIndex()
          : this.state.songIndex + 1,
        currentTime: 0,
        playing: true
      });
      this.refs.audio.seek(0); //eslint-disable-line
    }
  }

  goBackward() {
    if (this.state.currentTime < 3 && this.state.songIndex !== 0) {
      this.setState({
        songIndex: this.state.songIndex - 1,
        currentTime: 0
      });
    } else {
      this.refs.audio.seek(0); //eslint-disable-line
      this.setState({
        currentTime: 0
      });
    }
  }

  onEnd() {
    this.setState({ playing: false });
    this.setState({ playing: true });
  }

  renderVideoPlayer() {
    if (this.state.songs[this.state.songIndex]) {
      return (
        <Video
          source={{ uri: this.state.songs[this.state.songIndex].path }}
          volume={this.state.muted ? 0 : 1.0}
          muted={false}
          ref="audio"
          paused={!this.state.playing}
          playInBackground
          onLoad={this.onLoad}
          onProgress={this.setTime}
          onEnd={this.onEnd}
          resizeMode="cover"
          repeat={false}
        />
      );
    }
    return null;
  }

  renderProgressBar() {
    if (this.props.searchedSongs) {
      const song = this.state.songs[this.state.songIndex];
      return (
        <Progress.Bar
          progress={this.props.progreses[song.id]}
          width={width}
          color="#fff"
          borderColor="transparent"
        />
      );
    }
    return null;
  }

  render() {
    let songPercentage;
    if (this.state.songDuration !== undefined) {
      songPercentage = this.state.currentTime / this.state.songDuration;
    } else {
      songPercentage = 0;
    }
    return (
      <View style={Styles.container}>
        {this.renderVideoPlayer()}

        {this.renderProgressBar()}
        <Image
          style={Styles.songImage}
          source={{
            uri: (Platform.OS === 'android' ? 'file://' : '') +
              this.state.songs[this.state.songIndex].thumb
          }}
        />

        {this.renderProgressBar()}
        <Text style={Styles.songTitle}>
          {this.state.songs[this.state.songIndex].title}
        </Text>
        <SongSlider
          onSlidingStart={this.onSlidingStart}
          onSlidingComplete={this.onSlidingComplete}
          onValueChange={this.onSlidingChange}
          value={songPercentage}
          songDuration={this.state.songDuration}
          currentTime={this.state.currentTime}
        />
        <View style={Styles.controls}>
          <ShuffleButton
            shuffle={this.state.shuffle}
            toggleShuffle={this.toggleShuffle}
            disabled={this.props.search}
          />
          <BackwardButton goBackward={this.goBackward} />
          <PlayButton
            togglePlay={this.togglePlay}
            playing={this.state.playing}
          />
          <ForwardButton
            songs={this.state.songs}
            shuffle={this.state.shuffle}
            songIndex={this.state.songIndex}
            goForward={this.goForward}
            disabled={this.props.search}
          />
          <VolumeButton
            muted={this.state.muted}
            toggleVolume={this.toggleVolume}
          />
        </View>
      </View>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(Actions, dispatch), dispatch };
}

function mapStateToProps(store) {
  return {
    songs: store.songs,
    searchResults: store.searchResults,
    progreses: store.progreses
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AudioPlayer);
