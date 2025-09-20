import { create } from 'xmlbuilder2'
import { format, parseISO } from 'date-fns'
import type { Episode } from '../server/routes/api/episodes.js'

const NAMESPACE = process.env.XML_NS || 'urn:episode-registry:v1'

export async function exportToXML(episodes: Episode[]): Promise<string> {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('episodes', { 
      xmlns: NAMESPACE,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    })

  // Add metadata
  const metadata = root.ele('metadata')
  metadata.ele('totalEpisodes').txt(episodes.length.toString())
  metadata.ele('exportDate').txt(new Date().toISOString())
  
  // Context summary
  const contextCounts: Record<string, number> = {}
  episodes.forEach(ep => {
    contextCounts[ep.context] = (contextCounts[ep.context] || 0) + 1
  })
  
  const contextSummary = metadata.ele('contextSummary')
  Object.entries(contextCounts).forEach(([context, count]) => {
    contextSummary.ele('contextCount', {
      type: context,
      count: count.toString()
    })
  })

  // Add episodes
  episodes.forEach(episode => {
    const episodeElement = root.ele('episode', {
      id: episode.episodeId,
      formId: episode.formId
    })

    // Timestamp
    episodeElement.ele('timestamp').txt(episode.timestamp)
    
    // Teacher information
    const teacherElement = episodeElement.ele('teacher', {
      id: episode.teacherId
    })
    teacherElement.txt(episode.teacherName)

    // Form information
    if (episode.formTitle) {
      episodeElement.ele('form', {
        id: episode.formId
      }).txt(episode.formTitle)
    }

    // Core episode data
    episodeElement.ele('context').txt(episode.context)
    episodeElement.ele('trigger').txt(episode.trigger)
    episodeElement.ele('response').txt(episode.response)
    
    if (episode.duration) {
      episodeElement.ele('duration').txt(episode.duration)
    }
    
    if (episode.resolution) {
      episodeElement.ele('resolution').txt(episode.resolution)
    }
    
    if (episode.notes) {
      episodeElement.ele('notes').txt(episode.notes)
    }

    // Form responses (if any)
    if (episode.formResponses && Object.keys(episode.formResponses).length > 0) {
      const responsesElement = episodeElement.ele('formResponses')
      Object.entries(episode.formResponses).forEach(([fieldId, value]) => {
        responsesElement.ele('field', {
          id: fieldId
        }).txt(String(value))
      })
    }

    // Timestamps
    episodeElement.ele('createdAt').txt(episode.createdAt)
    episodeElement.ele('updatedAt').txt(episode.updatedAt)
  })

  // Generate XML string with pretty formatting
  return root.end({ 
    prettyPrint: true,
    indent: '  '
  })
}

export async function parseXML(xmlContent: string): Promise<Episode[]> {
  try {
    const doc = create(xmlContent)
    const episodes: Episode[] = []
    
    // Parse each episode element
    const episodeNodes = doc.root().find((node) => node.node.nodeName === 'episode')
    
    for (const episodeNode of episodeNodes) {
      const episodeId = episodeNode.att('id') as string
      const formId = episodeNode.att('formId') as string
      
      // Extract teacher info
      const teacherNode = episodeNode.first('teacher')
      const teacherId = teacherNode?.att('id') as string
      const teacherName = teacherNode?.txt() || ''
      
      // Extract form title
      const formNode = episodeNode.first('form')
      const formTitle = formNode?.txt()
      
      // Extract core data
      const timestamp = episodeNode.first('timestamp')?.txt() || new Date().toISOString()
      const context = episodeNode.first('context')?.txt() as Episode['context'] || 'other'
      const trigger = episodeNode.first('trigger')?.txt() || ''
      const response = episodeNode.first('response')?.txt() || ''
      const duration = episodeNode.first('duration')?.txt() || ''
      const resolution = episodeNode.first('resolution')?.txt() || ''
      const notes = episodeNode.first('notes')?.txt()
      
      // Extract form responses
      const formResponses: Record<string, any> = {}
      const responsesNode = episodeNode.first('formResponses')
      if (responsesNode) {
        const fieldNodes = responsesNode.find((node) => node.node.nodeName === 'field')
        for (const fieldNode of fieldNodes) {
          const fieldId = fieldNode.att('id') as string
          const value = fieldNode.txt()
          if (fieldId) {
            formResponses[fieldId] = value
          }
        }
      }
      
      // Extract timestamps
      const createdAt = episodeNode.first('createdAt')?.txt() || new Date().toISOString()
      const updatedAt = episodeNode.first('updatedAt')?.txt() || new Date().toISOString()
      
      // Create episode object
      const episode: Episode = {
        PK: `EPISODE#${episodeId}`,
        SK: 'METADATA',
        episodeId,
        formId,
        formTitle,
        createdBy: `USER#${teacherId}`,
        teacherId,
        teacherName,
        timestamp,
        context,
        trigger,
        response,
        duration,
        resolution,
        notes,
        formResponses: Object.keys(formResponses).length > 0 ? formResponses : undefined,
        GSI1PK: `FORM#${formId}`,
        GSI1SK: `TS#${timestamp}`,
        GSI2PK: `TEACHER#${teacherId}`,
        GSI2SK: `TS#${timestamp}`,
        createdAt,
        updatedAt
      }
      
      episodes.push(episode)
    }
    
    return episodes
  } catch (error) {
    console.error('Failed to parse XML:', error)
    throw new Error('Invalid XML format')
  }
}

// Export XML schema for documentation
export const xmlSchema = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="${NAMESPACE}"
           xmlns="${NAMESPACE}"
           elementFormDefault="qualified">

  <xs:element name="episodes">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="metadata" type="metadataType"/>
        <xs:element name="episode" type="episodeType" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="generatedAt" type="xs:dateTime" use="required"/>
      <xs:attribute name="version" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>

  <xs:complexType name="metadataType">
    <xs:sequence>
      <xs:element name="totalEpisodes" type="xs:integer"/>
      <xs:element name="exportDate" type="xs:dateTime"/>
      <xs:element name="contextSummary" type="contextSummaryType"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="contextSummaryType">
    <xs:sequence>
      <xs:element name="contextCount" maxOccurs="unbounded">
        <xs:complexType>
          <xs:attribute name="type" type="contextEnum" use="required"/>
          <xs:attribute name="count" type="xs:integer" use="required"/>
        </xs:complexType>
      </xs:element>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="episodeType">
    <xs:sequence>
      <xs:element name="timestamp" type="xs:dateTime"/>
      <xs:element name="teacher" type="teacherType"/>
      <xs:element name="form" type="formType" minOccurs="0"/>
      <xs:element name="context" type="contextEnum"/>
      <xs:element name="trigger" type="xs:string"/>
      <xs:element name="response" type="xs:string"/>
      <xs:element name="duration" type="xs:string" minOccurs="0"/>
      <xs:element name="resolution" type="xs:string" minOccurs="0"/>
      <xs:element name="notes" type="xs:string" minOccurs="0"/>
      <xs:element name="formResponses" type="formResponsesType" minOccurs="0"/>
      <xs:element name="createdAt" type="xs:dateTime"/>
      <xs:element name="updatedAt" type="xs:dateTime"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="formId" type="xs:string" use="required"/>
  </xs:complexType>

  <xs:complexType name="teacherType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="id" type="xs:string" use="required"/>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>

  <xs:complexType name="formType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="id" type="xs:string" use="required"/>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>

  <xs:complexType name="formResponsesType">
    <xs:sequence>
      <xs:element name="field" maxOccurs="unbounded">
        <xs:complexType>
          <xs:simpleContent>
            <xs:extension base="xs:string">
              <xs:attribute name="id" type="xs:string" use="required"/>
            </xs:extension>
          </xs:simpleContent>
        </xs:complexType>
      </xs:element>
    </xs:sequence>
  </xs:complexType>

  <xs:simpleType name="contextEnum">
    <xs:restriction base="xs:string">
      <xs:enumeration value="class"/>
      <xs:enumeration value="recess"/>
      <xs:enumeration value="lunch"/>
      <xs:enumeration value="hall"/>
      <xs:enumeration value="other"/>
    </xs:restriction>
  </xs:simpleType>

</xs:schema>`