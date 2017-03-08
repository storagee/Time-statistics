import React, {Component} from 'react';
import logo from './clock.svg';
import './App.css';
import JsonEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';
import 'jsoneditor/examples/css/darktheme.css';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            json: ''
        };
        this.typeRecording = {};
        this.processRecording = {};
        this.day = "";
    }

    componentDidMount() {
        this.jsonEditor = new JsonEditor(this.jsonWrapper, {
            mode: 'view'
        });
        let jsonIntro = {
            "day": "2017-3-7",
            "processes": [
                {
                    "name": "write this program",
                    "type": "work",
                    "startTime": "2017-3-7 9:21:00",
                    "endTime": "2017-3-7 15:21:48",
                    "processes": [
                        {
                            "name": "learn webpack",
                            "type": "personal promotion",
                            "startTime": "2017-3-7 9:21:00",
                            "endTime": "2017-3-7 10:21:00",
                            "processes": [
                                {
                                    "name": "npm install",
                                    "type": ["waste", "type example"],
                                    "startTime": "2017-3-7 9:21:00",
                                    "endTime": "2017-3-7 9:31:05",
                                    "processes": []
                                }
                            ]
                        },
                        {
                            "name": "learn react",
                            "type": "personal promotion",
                            "startTime": "2017-3-7 10:23:43",
                            "endTime": "2017-3-7 13:21:00",
                            "processes": []
                        },
                        {
                            "name": "coding",
                            "type": "coding",
                            "startTime": "2017-3-7 13:21:00",
                            "endTime": "2017-3-7 15:21:48",
                            "processes": []
                        }
                    ]
                },
                {
                    "name": "publish to github",
                    "type": "social",
                    "startTime": "2017-3-7 15:22:25",
                    "endTime": "2017-3-7 15:32:29",
                    "processes": []
                }
            ]
        };
        this.setState({
            json: JSON.stringify(jsonIntro, null, 4)
        }, ()=> {
            this.analyse(this.state.json);
        })
    }

    handleTimeInputChange = (event) => {
        this.processRecording = {};
        this.typeRecording = {};
        this.setState({
            json: event.target.value
        }, ()=> {
            this.analyse(this.state.json);
        });
    };

    analyse = (json) => {
        if (this.state.json.trim().length !== 0) {
            try {
                let dayRecording = JSON.parse(this.state.json);
                if (!this.day) {
                    this.day = dayRecording.day;
                }
                this.calculateTotalTime(dayRecording);

                // 统计串行的根节点的时间（当然可以把并行的两个进程都在根节点上写，那么一天的时间会超过 24 小时，比如你在开会的时候，又在写代码）
                dayRecording.processes.forEach((item)=> {
                    if (!this.processRecording[item.name]) {
                        this.processRecording[item.name] = item.totalTime
                    } else {
                        this.processRecording[item.name] = this.timeAdder(this.processRecording[item.name], item.totalTime);
                    }
                });

                dayRecording.rootAnalysation = this.processRecording;
                dayRecording.typeAnalysation = this.typeRecording;

                // 更新 jsonEditor
                this.jsonEditor.set(dayRecording);
            } catch (e) {
                alert(`json 语法错误：${e}`);
            }
        }
    };

    adjustTime = (time) => {
        time = time.replace("：", ":");
        // 应对 8:01 分这种情况，格式化成 2017-3-7 08:01:00
        if (time.length <= 5) {
            let times = time.split(":");
            time = `${this.day} ${this.addPrefix(times[0])}:${this.addPrefix(times[1])}:00`;
        }
        return time;
    };

    getMinute = (startTimeStr, endTimeStr) => {
        try {
            let startTime = new Date(startTimeStr).getTime(),
                endTime = new Date(endTimeStr).getTime(),
                totalMillisecond = endTime - startTime,
                totalSecond = totalMillisecond / 1000,
                totalMinute = Math.floor(totalSecond / 60),
                minute = totalMinute % 60,
                second = totalSecond % 60,
                totalHour = Math.floor(totalMinute / 60);
            return this.addPrefix(totalHour) + ':' + this.addPrefix(minute) + ':' + this.addPrefix(second)
        } catch (e) {
            return new Error("时间不完整");
        }
    };

    addPrefix = (n) => {
        n = n * 1;
        if (n < 10) {
            return `0${n}`;
        } else {
            return n;
        }
    };

    /**
     * 计算时间的和，类似 00:01:59 与 01:49:15 的和，返回 01:51:14
     * @param { string } time1 时间，格式为 00:01:59
     * @param { string } time2 时间，格式为 00:01:59
     */
    timeAdder = (time1, time2) => {
        let time1Split = time1.split(":"),
            time2Split = time2.split(":"),
            secondSum = time1Split[2] * 1 + time2Split[2] * 1,
            realSecond = secondSum % 60,
            secondGivToMinute = Math.floor(secondSum / 60),
            minuteSum = time1Split[1] * 1 + time2Split[1] * 1 + secondGivToMinute,
            realMinute = minuteSum % 60,
            minuteGivToHour = Math.floor(minuteSum / 60),
            hourSum = time1Split[0] * 1 + time2Split[0] * 1 + minuteGivToHour;
        return `${this.addPrefix(hourSum)}:${this.addPrefix(realMinute)}:${this.addPrefix(realSecond)}`;
    };

    typeRecord = (type, time) => {
        if (!this.typeRecording[type]) {
            this.typeRecording[type] = time
        } else {
            this.typeRecording[type] = this.timeAdder(this.typeRecording[type], time);
        }
    };

    calculateTotalTime = (dayRecording) => {
        if (dayRecording.processes && dayRecording.processes.length !== 0) {
            let processes = dayRecording.processes;
            processes.forEach((item)=> {
                if (item.startTime && item.endTime) {
                    try {
                        item.startTime = this.adjustTime(item.startTime);
                        item.endTime = this.adjustTime(item.endTime);
                        item.totalTime = this.getMinute(item.startTime, item.endTime);


                        // 统计每一个节点
                        if (typeof item.type === 'string') {
                            this.typeRecord(item.type, item.totalTime);
                        } else if (item.type instanceof Array) {
                            item.type.forEach((eachType)=> {
                                // 时间会增多，一天的时间会大于 24 小时，但主要是用于统计某个进程属于多个分类的情况，比如在地铁上阅读
                                // 那么这个 type 可以是交通，也可以是阅读
                                this.typeRecord(eachType, item.totalTime);
                            })
                        }
                        this.calculateTotalTime(item)
                    } catch (e) {
                        if (item.name) {
                            alert(`"${item.name}"中时间不完整`);
                        } else {
                            alert(`时间不完整`);
                        }
                    }
                } else {
                    if (item.name) {
                        alert(`"${item.name}"中时间不完整`);
                    } else {
                        alert(`时间不完整`);
                    }
                }
            })
        } else if (!(dayRecording.processes instanceof Array)) {
            alert("每个进程都需要有 processes，空则赋值为: []");
        }
    };


    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <div className="header-wrapper">
                        <img src={logo} className="App-logo" alt="logo"/>
                        <h2>Time statistics</h2>
                    </div>
                </div>
                <p className="App-intro">
                    <textarea onChange={this.handleTimeInputChange} value={this.state.json} className="time-input"
                              name="time-input"></textarea>
                </p>
                <div className="json-wrapper" ref={(jsonWrapper)=> {
                    this.jsonWrapper = jsonWrapper
                }}>

                </div>
            </div>
        );
    }
}

export default App;
