import { motion, AnimatePresence } from 'framer-motion'
import { AURA_AGENTS } from '../../utils/constants'
import { formatTimestamp } from '../../utils/formatters'
import NodeCard from './NodeCard'
import ConnectorArrow from './ConnectorArrow'
import EventTimeline from './EventTimeline'

export default function AgentVisualiser({
  nodeStates = {},
  events = [],
  compact = false,
  translationInfo = null, // { fromLang, fromScript, fromText, toText }
}) {
  const agents = AURA_AGENTS

  // Find first blocked node index
  const blockedIndex = agents.findIndex(a => nodeStates[a.shortName.toLowerCase()]?.status === 'blocked')

  return (
    <div className="w-full">
      {/* Node Chain */}
      <div className={`flex ${compact ? 'gap-1' : 'gap-0'} ${compact ? '' : 'md:flex-row flex-col'} items-stretch`}>
        {agents.map((agent, i) => {
          const nodeKey = agent.shortName.toLowerCase()
          const state = nodeStates[nodeKey] || { status: 'waiting' }
          const isDownstreamOfBlock = blockedIndex >= 0 && i > blockedIndex
          const isReview = state.status === 'review'
          const isDownstreamOfReview = !isDownstreamOfBlock && agents.findIndex(a => nodeStates[a.shortName.toLowerCase()]?.status === 'review') >= 0 &&
            i > agents.findIndex(a => nodeStates[a.shortName.toLowerCase()]?.status === 'review')

          return (
            <div key={agent.id} className={`flex ${compact ? '' : 'md:flex-row flex-col'} items-center`}>
              <NodeCard
                agent={agent}
                state={state}
                compact={compact}
                dimmed={isDownstreamOfBlock}
                isReview={isReview}
                pendingReview={isDownstreamOfReview}
                translationInfo={nodeKey === 'translate' ? translationInfo : null}
              />
              {i < agents.length - 1 && (
                <ConnectorArrow
                  fromStatus={state.status}
                  toStatus={nodeStates[agents[i + 1].shortName.toLowerCase()]?.status || 'waiting'}
                  blocked={isDownstreamOfBlock || (blockedIndex >= 0 && i >= blockedIndex)}
                  review={isReview}
                  compact={compact}
                  vertical={!compact && typeof window !== 'undefined' && window.innerWidth < 768}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Event Timeline */}
      {!compact && events.length > 0 && (
        <div className="mt-6">
          <EventTimeline events={events} />
        </div>
      )}
    </div>
  )
}
