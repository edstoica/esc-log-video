import { LogFileData, LogFileDataSeries } from './logFileData'
import { FileSpecificationColumn, FileSpecificationCompositeColumn } from './fileSpecification'

import { Time } from './dataTypes'
import { Unit } from './units'

export class LogFileDataHelper {
  _logFileData: LogFileData | null
  _timeStep: number
  _currentTime: number
  _currentIndex: number
  _startTime: number
  _endTime: number
  _timeSeries: LogFileDataSeries | null

  constructor() {
    this._logFileData = null
    this._timeSeries = null
    // step between frames
    this._timeStep = 1/30
    this._currentTime = 0
    this._currentIndex = 0
    this._startTime = 0
    this._endTime = 0
  }

  get fps(): number {
    return 1/this._timeStep
  }

  set fps(value: number) {
    this._timeStep = 1/value
  }

  get timeSeries(): LogFileDataSeries | null {
    return this._timeSeries
  }

  /**
   * Progress of the log file helper through the total duration of the
   * data set. This is based on times, not the array index to give better
   * indication of progress to users where time steps in array may be
   * large.
   * @returns number between 0 and 1
   */
  progress(): number {
    let dtTotal = this._endTime - this._startTime
    let dtCurrent = this._currentTime - this._startTime
    return dtCurrent / dtTotal
  }

  set logFileData(value: LogFileData) {
    this._logFileData = value
    this._currentTime = 0

    for (let s of this._logFileData!.seriesList) {
      if (s.column.dataType instanceof Time && !s.column.hidden) {
        this._timeSeries = s
        this._startTime = s.data[0]
        this._currentTime = s.data[0]
        this._currentIndex = 0
        this._endTime = s.data[s.data.length - 1]
        return
      }
    }

    throw new Error('No time based data series found')
  }

  get logFileData() {
    return this._logFileData!
  }

  /**
   * Resets the helper back to the start
   */
  reset() {
    if (!this._timeSeries) {
      return false
    }

    this._currentIndex = 0
    this._startTime = this._timeSeries!.data[0]
    this._currentTime = this._timeSeries!.data[0]
  }

  /**
   * Increments the current time to the next frame based on the FPS set
   * @returns true if the current time is still less than the end time of this dataset
   */
  incrementCurrentTime(): boolean {
    if (!this._timeSeries) {
      return false
    }
    this._currentTime += this._timeStep

    if (this._currentIndex != this._timeSeries!.data.length - 1) {

      while (true) {
        let timeAtNextIndex = this._timeSeries!.data[this._currentIndex + 1]
        if (this._currentTime >= timeAtNextIndex) {
          this._currentIndex += 1
        } else {
          break
        }
      }

    }

    return this._currentTime <= this._endTime
  }

  /**
   * gets the value for this column of data at the current time
   * @param column 
   * @param units 
   * @returns 
   */
  getValue(column: FileSpecificationColumn, units: Unit): any {
    for (let series of this._logFileData!.seriesList) {
      if (series.column == column) {
        let rawVal = series.data[this._currentIndex]
        if (column instanceof FileSpecificationCompositeColumn) {
          // don't convert composite column values
          // TODO may need to revisit this in future
          return rawVal
        } else {
          let valInUnits = units.convert(rawVal)
          return valInUnits
        }
      }
    }
  }

}