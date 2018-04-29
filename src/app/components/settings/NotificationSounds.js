import React from 'react'
import { Col, Input, Row } from 'react-bootstrap'
import Settings from '../../services/Settings'
import SoundCache from '../../services/SoundCache'

export default ({ notificationSound, updateNotificationSound }) => {

  const toggleDisableSounds = () => {
    const soundsDisabled = Settings.get('defaultSound') === 'no'
    if (soundsDisabled) {
      Settings.set('defaultSound', 'po')
    } else {
      Settings.set('defaultSound', 'no')
    }
    // State will automatically update through settings change
  }

  // List of sounds
  const soundOptions = SoundCache.getSoundList().map((element, index) => {
    return (
      <option value={element[0]} key={index}>{element[1]}</option>
    )
  })

  const soundsDisabled = Settings.get('defaultSound') === 'no'
  let defaultSoundSetting = ''
  if (!soundsDisabled) {
    defaultSoundSetting = (
      <div>
        <hr/>
        <Row>
          <Col xs={6}><b>Default sound</b></Col>
          <Col xs={6}>
            <div className="default-class">
              <select className="form-control" value={notificationSound}
                      onChange={updateNotificationSound}>
                {soundOptions}
              </select>
            </div>
          </Col>
        </Row>
      </div>
    )
  }

  return (
    <div>
      <Row>
        <Col xs={8}><b>Disable sounds</b></Col>
        <Col xs={4}>
          <div className="default-class">
            <input type="checkbox" readOnly checked={soundsDisabled}
                   onClick={toggleDisableSounds}/>
          </div>
        </Col>
      </Row>
      {defaultSoundSetting}
    </div>
  )
}